from starlette.concurrency import run_in_threadpool
# =============================================================================
# app/bot/handlers/profile_handler.py — Bot Profile Handler
#
# TANGGUNG JAWAB:
#   - /profile — Lihat profil
#   - /editprofile — Edit nama dan bio (ConversationHandler)
# =============================================================================

import logging
from datetime import datetime

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from app.bot import messages
from app.bot.handlers.expense_handler import require_linked_account
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.models.profile import ProfileOut, UpdateProfileRequest
from app.repositories.profile_repository import ProfileRepository
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)

# States
WAITING_NAME, WAITING_BIO = range(2)


def _escape_markdown_v2(text: str) -> str:
    special = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{ch}" if ch in special else ch for ch in str(text))


def _make_profile_repo() -> ProfileRepository:
    return ProfileRepository(client=get_admin_supabase_client())


def _clear_edit_context(context: ContextTypes.DEFAULT_TYPE) -> None:
    context.user_data.pop("edit_user_id", None)
    context.user_data.pop("edit_display_name", None)


# ── /profile ──────────────────────────────────────────────────────────────────

async def cmd_profile(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Tampilkan profil user yang sedang login."""
    linked = await require_linked_account(update)
    if not linked:
        return

    try:
        repo = _make_profile_repo()
        profile_data = await run_in_threadpool(repo.find_by_user_id, linked["id"])
        profile_out = ProfileOut.from_db(profile_data)

        try:
            dt = datetime.fromisoformat(str(profile_out.created_at).replace("Z", "+00:00"))
            created_str = dt.strftime("%d %B %Y")
        except Exception:
            created_str = str(profile_out.created_at)

        text = messages.PROFILE_INFO.format(
            display_name=_escape_markdown_v2(profile_out.display_name or "Belum diset"),
            bio=_escape_markdown_v2(profile_out.bio or "Belum ada bio"),
            created_at=_escape_markdown_v2(created_str),
        )

        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN_V2)
    except AppError:
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected error during /profile")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


# ── /editprofile: ConversationHandler ────────────────────────────────────────

async def cmd_editprofile_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Entry point untuk /editprofile."""
    linked = await require_linked_account(update)
    if not linked:
        return ConversationHandler.END

    user_id = linked["id"]
    context.user_data["edit_user_id"] = user_id

    current_name = linked.get("display_name") or "Belum diset"
    try:
        repo = _make_profile_repo()
        profile_data = await run_in_threadpool(repo.find_by_user_id, user_id)
        current_name = profile_data.get("display_name") or current_name
    except Exception:
        pass

    await update.message.reply_text(
        messages.ASK_NEW_DISPLAY_NAME.format(current_name=_escape_markdown_v2(current_name)),
        parse_mode=ParseMode.MARKDOWN_V2,
    )
    return WAITING_NAME


async def _prompt_bio_step(update: Update, user_id: str) -> None:
    """Show current bio prompt for the second step in edit profile flow."""
    current_bio = "Belum ada bio"
    try:
        repo = _make_profile_repo()
        profile_data = await run_in_threadpool(repo.find_by_user_id, user_id)
        current_bio = profile_data.get("bio") or current_bio
    except Exception:
        pass

    await update.message.reply_text(
        messages.ASK_NEW_BIO.format(current_bio=_escape_markdown_v2(current_bio)),
        parse_mode=ParseMode.MARKDOWN_V2,
    )


async def handle_new_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Terima nama baru dari user."""
    context.user_data["edit_display_name"] = update.message.text.strip()

    user_id = context.user_data.get("edit_user_id")
    await _prompt_bio_step(update, user_id)
    return WAITING_BIO


async def handle_skip_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """User skip perubahan nama."""
    context.user_data["edit_display_name"] = None

    user_id = context.user_data.get("edit_user_id")
    await _prompt_bio_step(update, user_id)
    return WAITING_BIO


async def handle_new_bio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Terima bio baru, simpan semua perubahan."""
    new_bio = update.message.text.strip()
    user_id = context.user_data.get("edit_user_id")
    new_name = context.user_data.get("edit_display_name")

    linked = await require_linked_account(update)
    if not linked or str(linked["id"]) != str(user_id):
        _clear_edit_context(context)
        return ConversationHandler.END

    try:
        payload = UpdateProfileRequest(display_name=new_name, bio=new_bio).to_update_dict()
        if payload:
            repo = _make_profile_repo()
            await run_in_threadpool(repo.update, user_id=user_id, update_data=payload)

        await update.message.reply_text(messages.PROFILE_UPDATED, parse_mode=ParseMode.MARKDOWN_V2)
    except AppError:
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected error during /editprofile save")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    finally:
        _clear_edit_context(context)

    return ConversationHandler.END


async def handle_skip_bio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """User skip perubahan bio — simpan hanya nama jika ada perubahan."""
    user_id = context.user_data.get("edit_user_id")
    new_name = context.user_data.get("edit_display_name")

    linked = await require_linked_account(update)
    if not linked or str(linked["id"]) != str(user_id):
        _clear_edit_context(context)
        return ConversationHandler.END

    try:
        payload = UpdateProfileRequest(display_name=new_name).to_update_dict()
        if payload:
            repo = _make_profile_repo()
            await run_in_threadpool(repo.update, user_id=user_id, update_data=payload)

        await update.message.reply_text(messages.PROFILE_UPDATED, parse_mode=ParseMode.MARKDOWN_V2)
    except AppError:
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected error during /editprofile skip bio")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    finally:
        _clear_edit_context(context)

    return ConversationHandler.END


async def cancel_editprofile(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel active edit profile flow and clear temp context."""
    _clear_edit_context(context)
    await update.message.reply_text(messages.CANCELLED, parse_mode=ParseMode.MARKDOWN_V2)
    return ConversationHandler.END


def build_editprofile_conversation() -> ConversationHandler:
    """Factory untuk ConversationHandler /editprofile."""
    return ConversationHandler(
        entry_points=[CommandHandler("editprofile", cmd_editprofile_start)],
        states={
            WAITING_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_new_name),
                CommandHandler("skip", handle_skip_name),
            ],
            WAITING_BIO: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_new_bio),
                CommandHandler("skip", handle_skip_bio),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel_editprofile)],
    )
