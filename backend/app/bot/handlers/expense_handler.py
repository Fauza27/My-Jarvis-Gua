from starlette.concurrency import run_in_threadpool
from datetime import datetime
from zoneinfo import ZoneInfo
# =============================================================================
# app/bot/handlers/expense_handler.py — Bot Expense Handler
#
# TANGGUNG JAWAB:
#   Semua interaksi expense di Telegram Bot:
#   - /addexpense (ConversationHandler multi-step)
#   - /list (tampilkan transaksi dengan tombol aksi)
#   - Callback: detail dan hapus
#   - /stats
# =============================================================================

import logging
from typing import Optional

from telegram import Update
from telegram.ext import (
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)
from telegram.constants import ParseMode

from app.bot import messages
from app.bot.keyboards import (
    confirm_delete_expense_keyboard,
    expense_action_keyboard,
)
from app.bot.handlers.auth_handler import get_linked_profile
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.models.expense import CreateExpenseRequest
from app.repositories.expense_repository import ExpenseRepository
from app.services.expense_service import ExpenseService
from app.core.exceptions import AppError, NotFoundError

logger = logging.getLogger(__name__)

# State untuk ConversationHandler /addexpense
WAITING_AMOUNT, WAITING_TYPE, WAITING_CATEGORY, WAITING_DESCRIPTION, WAITING_DATE = range(5)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _escape_markdown_v2(text: str) -> str:
    """Escape characters that are special in Telegram MarkdownV2."""
    special = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{ch}" if ch in special else ch for ch in str(text))


def _make_expense_service_for_user() -> ExpenseService:
    """Use admin client and always enforce user_id filters at service/repository calls."""
    admin_client = get_admin_supabase_client()
    from app.infrastructure.openai_client import get_openai_client
    from app.repositories.ai_repository import AIRepository
    from app.services.embedding_services import EmbeddingService
    return ExpenseService(
        expense_repo=ExpenseRepository(client=admin_client),
        embedding_service=EmbeddingService(get_openai_client(), AIRepository(admin_client)),
    )


async def require_linked_account(update: Update) -> Optional[dict]:
    """Ensure Telegram account already linked before accessing expense features."""
    chat_id = update.effective_chat.id
    profile = await get_linked_profile(chat_id)

    if not profile:
        if update.message:
            await update.message.reply_text(
                messages.NOT_CONNECTED,
                parse_mode=ParseMode.MARKDOWN_V2,
            )
        return None

    return profile


def _clear_add_expense_context(context: ContextTypes.DEFAULT_TYPE) -> None:
    for key in (
        "current_user_id",
        "expense_amount",
        "expense_type",
        "expense_category",
        "expense_description",
    ):
        context.user_data.pop(key, None)


async def _create_expense_and_reply(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    user_id: str,
    transaction_date: Optional[str],
) -> int:
    """Persist expense and send confirmation message."""
    current_profile = await require_linked_account(update)
    if not current_profile or str(current_profile["id"]) != str(user_id):
        _clear_add_expense_context(context)
        return ConversationHandler.END
    if transaction_date is None:
        transaction_date = datetime.now(ZoneInfo(current_profile.get("timezone") or "UTC")).date().isoformat()
    try:
        expense_service = _make_expense_service_for_user()
        amount = context.user_data["expense_amount"]
        expense_type = context.user_data["expense_type"]
        category = context.user_data["expense_category"]
        description = context.user_data.get("expense_description")

        request = CreateExpenseRequest(
            amount=amount,
            type=expense_type,
            category=category,
            description=description,
            transaction_date=transaction_date,
        )

        created = await run_in_threadpool(expense_service.create_expense, user_id=user_id, request=request)

        summary = (
            f"Rp {created.amount:,.2f} | {created.type} | {created.category}"
            + (f" | {created.description}" if created.description else "")
        )

        if created.transaction_date:
            date_line = messages.EXPENSE_CREATED_DATE_LINE.format(due_date=_escape_markdown_v2(str(created.transaction_date)))
        else:
            date_line = messages.EXPENSE_CREATED_NO_DATE_LINE

        await update.message.reply_text(
            messages.EXPENSE_CREATED.format(
                title=_escape_markdown_v2(summary),
                date_line=date_line,
            ),
            parse_mode=ParseMode.MARKDOWN_V2,
        )
    except AppError as e:
        logger.error("Error creating expense: %s", e.message)
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected error while creating expense")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    finally:
        _clear_add_expense_context(context)

    return ConversationHandler.END


# ── /addexpense Conversation ─────────────────────────────────────────────────

async def cmd_addexpense_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Entry point for add expense flow."""
    profile = await require_linked_account(update)
    if not profile:
        return ConversationHandler.END

    context.user_data["current_user_id"] = profile["id"]
    await update.message.reply_text(messages.ASK_EXPENSE_AMOUNT, parse_mode=ParseMode.MARKDOWN_V2)
    return WAITING_AMOUNT


async def handle_expense_amount(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive amount and ask transaction type."""
    raw_amount = update.message.text.strip().replace(",", "")
    try:
        amount = float(raw_amount)
        if amount <= 0:
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ Nominal tidak valid\\. Masukkan angka lebih dari 0\\.",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return WAITING_AMOUNT

    context.user_data["expense_amount"] = amount
    await update.message.reply_text(messages.ASK_EXPENSE_TYPE, parse_mode=ParseMode.MARKDOWN_V2)
    return WAITING_TYPE


async def handle_expense_type(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive type (expense/income) and ask category."""
    expense_type = update.message.text.strip().lower()
    if expense_type not in {"expense", "income"}:
        await update.message.reply_text(
            "❌ Tipe harus `expense` atau `income`\\.",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return WAITING_TYPE

    context.user_data["expense_type"] = expense_type
    await update.message.reply_text(messages.ASK_EXPENSE_CATEGORY, parse_mode=ParseMode.MARKDOWN_V2)
    return WAITING_CATEGORY


async def handle_expense_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive category and ask optional description."""
    category = update.message.text.strip()
    if not category:
        await update.message.reply_text(
            "❌ Kategori tidak boleh kosong\\.",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return WAITING_CATEGORY

    context.user_data["expense_category"] = category
    await update.message.reply_text(messages.ASK_EXPENSE_DESCRIPTION, parse_mode=ParseMode.MARKDOWN_V2)
    return WAITING_DESCRIPTION


async def handle_expense_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive optional description then ask date."""
    description = update.message.text.strip()
    context.user_data["expense_description"] = description if description else None

    await update.message.reply_text(messages.ASK_EXPENSE_DATE, parse_mode=ParseMode.MARKDOWN_V2)
    return WAITING_DATE


async def handle_skip_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Skip description and ask date."""
    context.user_data["expense_description"] = None
    await update.message.reply_text(messages.ASK_EXPENSE_DATE, parse_mode=ParseMode.MARKDOWN_V2)
    return WAITING_DATE


async def handle_expense_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive transaction date in YYYY-MM-DD and create expense."""
    date_input = update.message.text.strip()
    user_id = context.user_data.get("current_user_id")
    if not user_id:
        _clear_add_expense_context(context)
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
        return ConversationHandler.END

    try:
        # Keep as string, validation will also happen in Pydantic model.
        from datetime import datetime
        datetime.strptime(date_input, "%Y-%m-%d")
    except ValueError:
        await update.message.reply_text(
            "❌ Format tanggal salah\\. Gunakan `YYYY\\-MM\\-DD`\\.",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return WAITING_DATE

    return await _create_expense_and_reply(update, context, user_id, transaction_date=date_input)


async def handle_skip_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Create expense with default transaction date (today)."""
    user_id = context.user_data.get("current_user_id")
    if not user_id:
        _clear_add_expense_context(context)
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
        return ConversationHandler.END

    return await _create_expense_and_reply(update, context, user_id, transaction_date=None)


# ── /list ─────────────────────────────────────────────────────────────────────

async def cmd_list_expenses(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show recent expenses with inline action buttons."""
    profile = await require_linked_account(update)
    if not profile:
        return

    user_id = profile["id"]

    try:
        expense_service = _make_expense_service_for_user()
        expense_list = await run_in_threadpool(expense_service.get_all_expenses,
            user_id=user_id,
            limit=20,
            sort_by="transaction_date",
            sort_order="desc",
        )

        if expense_list.total == 0:
            await update.message.reply_text(messages.NO_EXPENSES, parse_mode=ParseMode.MARKDOWN_V2)
            return

        await update.message.reply_text(
            messages.EXPENSE_LIST_HEADER.format(count=expense_list.total),
            parse_mode=ParseMode.MARKDOWN_V2,
        )

        for i, expense in enumerate(expense_list.expenses, start=1):
            title = f"Rp {expense.amount:,.2f} | {expense.type} | {expense.category}"
            date_info = (
                messages.EXPENSE_ITEM_DATE.format(due_date=_escape_markdown_v2(str(expense.transaction_date)))
                if expense.transaction_date
                else ""
            )
            item_text = messages.EXPENSE_ITEM.format(
                index=i,
                title=_escape_markdown_v2(title),
                date_info=date_info,
            )

            await update.message.reply_text(
                item_text,
                parse_mode=ParseMode.MARKDOWN_V2,
                reply_markup=expense_action_keyboard(expense.id),
            )
    except AppError as e:
        logger.error("List expense error: %s", e.message)
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected list expense error")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


# ── Callbacks ─────────────────────────────────────────────────────────────────

async def callback_view_expense(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show detail for one expense."""
    query = update.callback_query
    await query.answer()

    _, expense_id = query.data.split(":", 1)
    profile = await get_linked_profile(update.effective_chat.id)
    if not profile:
        await query.edit_message_text("❌ Akun tidak terhubung\\.", parse_mode=ParseMode.MARKDOWN_V2)
        return

    try:
        expense_service = _make_expense_service_for_user()
        expense = await run_in_threadpool(expense_service.get_expense_by_id, user_id=profile["id"], expense_id=expense_id)

        detail_text = (
            "🧾 *Detail Transaksi*\n\n"
            f"💰 Nominal: *Rp {_escape_markdown_v2(f'{expense.amount:,.2f}')}*\n"
            f"🧭 Tipe: *{_escape_markdown_v2(expense.type)}*\n"
            f"🏷️ Kategori: *{_escape_markdown_v2(expense.category)}*\n"
            f"📝 Deskripsi: {_escape_markdown_v2(expense.description or '-')}\n"
            f"📅 Tanggal: {_escape_markdown_v2(expense.transaction_date or 'hari ini')}"
        )

        await query.edit_message_text(detail_text, parse_mode=ParseMode.MARKDOWN_V2)
    except NotFoundError:
        await query.edit_message_text(messages.EXPENSE_NOT_FOUND, parse_mode=ParseMode.MARKDOWN_V2)
    except AppError as e:
        logger.error("View expense error: %s", e.message)
        await query.edit_message_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


async def callback_delete_expense(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ask confirmation before deleting an expense."""
    query = update.callback_query
    await query.answer()

    _, expense_id = query.data.split(":", 1)
    await query.edit_message_reply_markup(reply_markup=confirm_delete_expense_keyboard(expense_id))


async def callback_confirm_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Execute delete after user confirmation."""
    query = update.callback_query
    await query.answer()

    _, expense_id = query.data.split(":", 1)
    profile = await get_linked_profile(update.effective_chat.id)
    if not profile:
        await query.edit_message_text("❌ Akun tidak terhubung\\.", parse_mode=ParseMode.MARKDOWN_V2)
        return

    try:
        expense_service = _make_expense_service_for_user()
        await run_in_threadpool(expense_service.delete_expense, user_id=profile["id"], expense_id=expense_id)

        await query.edit_message_text(
            "🗑️ Data transaksi berhasil dihapus\\.",
            parse_mode=ParseMode.MARKDOWN_V2,
        )
    except NotFoundError:
        await query.edit_message_text(messages.EXPENSE_NOT_FOUND, parse_mode=ParseMode.MARKDOWN_V2)
    except AppError as e:
        logger.error("Delete expense error: %s", e.message)
        await query.edit_message_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


async def callback_cancel_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancel delete and restore initial action buttons."""
    query = update.callback_query
    await query.answer("Hapus dibatalkan")

    _, expense_id = query.data.split(":", 1)
    await query.edit_message_reply_markup(reply_markup=expense_action_keyboard(expense_id))


async def callback_mark_done(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Legacy callback maintained for backward compatibility."""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        "ℹ️ Fitur tandai selesai tidak digunakan di money tracker\\.",
        parse_mode=ParseMode.MARKDOWN_V2,
    )


# ── /stats ────────────────────────────────────────────────────────────────────

async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show all-time finance summary."""
    profile = await require_linked_account(update)
    if not profile:
        return

    try:
        expense_service = _make_expense_service_for_user()
        summary = await run_in_threadpool(expense_service.get_expense_summary_all_time, user_id=profile["id"])

        text = (
            "📊 *Ringkasan Keuangan*\n\n"
            f"⬆️ Total Income: *Rp {_escape_markdown_v2(f'{summary.total_income:,.2f}')}*\n"
            f"⬇️ Total Expense: *Rp {_escape_markdown_v2(f'{summary.total_expense:,.2f}')}*\n"
            f"💼 Saldo Bersih: *Rp {_escape_markdown_v2(f'{summary.net_balance:,.2f}')}*"
        )

        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN_V2)
    except AppError as e:
        logger.error("Stats error: %s", e.message)
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected stats error")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


# ── Builders ──────────────────────────────────────────────────────────────────

def build_addexpense_conversation() -> ConversationHandler:
    """Factory untuk ConversationHandler /addexpense."""
    return ConversationHandler(
        entry_points=[
            CommandHandler("addexpense", cmd_addexpense_start),
            MessageHandler(filters.Regex("^➕ Tambah Pengeluaran$"), cmd_addexpense_start),
        ],
        states={
            WAITING_AMOUNT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_amount),
            ],
            WAITING_TYPE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_type),
            ],
            WAITING_CATEGORY: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_category),
            ],
            WAITING_DESCRIPTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_description),
                CommandHandler("skip", handle_skip_description),
            ],
            WAITING_DATE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_date),
                CommandHandler("skip", handle_skip_date),
            ],
        },
        fallbacks=[CommandHandler("cancel", _cancel_addexpense)],
    )


def build_expense_callback_handlers() -> list[CallbackQueryHandler]:
    """Factory for callback query handlers used by expense list actions."""
    return [
        CallbackQueryHandler(callback_view_expense, pattern=r"^view_expense:"),
        CallbackQueryHandler(callback_delete_expense, pattern=r"^delete_expense:"),
        CallbackQueryHandler(callback_confirm_delete, pattern=r"^confirm_delete_expense:"),
        CallbackQueryHandler(callback_cancel_delete, pattern=r"^cancel_delete_expense:"),
        CallbackQueryHandler(callback_mark_done, pattern=r"^done:"),
    ]


async def _cancel_addexpense(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    _clear_add_expense_context(context)
    await update.message.reply_text(messages.CANCELLED, parse_mode=ParseMode.MARKDOWN_V2)
    return ConversationHandler.END
