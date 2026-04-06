# =============================================================================
# app/bot/application.py — Bot Application Factory
#
# TANGGUNG JAWAB:
#   Merakit semua handler menjadi satu bot yang siap berjalan.
#   Mirip dengan core/application.py untuk FastAPI.
#
# PRINSIP CLEAN CODE:
#   - Factory pattern: create_bot() membuat instance yang sudah terkonfigurasi
#   - Semua handler didaftarkan di satu tempat — mudah dilihat gambaran besarnya
#   - Error handler terpusat
#
# URUTAN PENDAFTARAN HANDLER PENTING:
#   ConversationHandler harus didaftarkan SEBELUM handler umum.
#   Jika tidak, MessageHandler umum akan "mencuri" input yang seharusnya
#   ditangani oleh ConversationHandler yang sedang aktif.
# =============================================================================

import logging

from telegram import BotCommand, Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from app.bot import messages
from app.bot.handlers import auth_handler, chat_handler, expense_handler, profile_handler, voice_handler
from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Centralized error handler for uncaught bot exceptions."""
    logger.error("Unhandled exception", exc_info=context.error)

    if isinstance(update, Update) and update.effective_message:
        try:
            await update.effective_message.reply_text(
                messages.UNEXPECTED_ERROR,
                parse_mode=ParseMode.MARKDOWN_V2,
            )
        except Exception:
            # Avoid infinite error loops when sending fallback message fails.
            pass


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handler untuk /help."""
    await update.message.reply_text(
        messages.HELP_TEXT,
        parse_mode=ParseMode.MARKDOWN_V2,
    )


async def handle_menu_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Map main keyboard button text to its handler."""
    text = (update.message.text or "").strip()

    if text == "📋 Lihat Pengeluaran":
        await expense_handler.cmd_list_expenses(update, context)
    elif text == "📊 Ringkasan":
        await expense_handler.cmd_stats(update, context)
    elif text == "🔌 Putuskan Akun":
        await auth_handler.cmd_disconnect(update, context)
    elif text == "👤 Profil Saya":
        await profile_handler.cmd_profile(update, context)
    elif text == "❓ Bantuan":
        await cmd_help(update, context)
    # "➕ Tambah Pengeluaran" ditangani oleh ConversationHandler entry point.


async def post_init(application: Application) -> None:
    """Set bot command list shown in Telegram UI."""
    await application.bot.set_my_commands(
        [
            BotCommand("start", "Mulai bot"),
            BotCommand("help", "Lihat bantuan"),
            BotCommand("connect", "Hubungkan akun"),
            BotCommand("disconnect", "Putuskan akun"),
            BotCommand("addexpense", "Tambah transaksi"),
            BotCommand("list", "Lihat daftar transaksi"),
            BotCommand("stats", "Lihat ringkasan keuangan"),
            BotCommand("profile", "Lihat profil"),
            BotCommand("editprofile", "Edit profil"),
            BotCommand("cancel", "Batalkan aksi aktif"),
        ]
    )


def create_bot() -> Application:
    """Factory function that assembles and returns a configured Telegram bot."""
    settings = get_settings()

    app = (
        ApplicationBuilder()
        .token(settings.TELEGRAM_BOT_TOKEN)
        # Required with ConversationHandler to avoid race conditions.
        .concurrent_updates(False)
        .post_init(post_init)
        .build()
    )

    # Error handler should be registered early.
    app.add_error_handler(error_handler)

    # Register conversation handlers first.
    app.add_handler(expense_handler.build_addexpense_conversation())
    app.add_handler(profile_handler.build_editprofile_conversation())

    # Register command handlers.
    app.add_handler(CommandHandler("start", auth_handler.cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("connect", auth_handler.cmd_connect))
    app.add_handler(CommandHandler("disconnect", auth_handler.cmd_disconnect))
    app.add_handler(CommandHandler("list", expense_handler.cmd_list_expenses))
    app.add_handler(CommandHandler("stats", expense_handler.cmd_stats))
    app.add_handler(CommandHandler("profile", profile_handler.cmd_profile))
    app.add_handler(CommandHandler("cancel", auth_handler.cmd_cancel))

    # Register callback query handlers.
    for callback_handler in expense_handler.build_expense_callback_handlers():
        app.add_handler(callback_handler)

    # Listen for direct connection codes being pasted
    app.add_handler(
        MessageHandler(
            filters.Regex(r"^MYJARVIS-[A-Z0-9]+$"),
            auth_handler.cmd_connect,
        )
    )

    # Register voice message handler.
    app.add_handler(voice_handler.build_voice_handler())

    # Register menu button message handler after conversation handlers.
    app.add_handler(
        MessageHandler(
            filters.Regex(r"^(📋 Lihat Pengeluaran|📊 Ringkasan|🔌 Putuskan Akun|👤 Profil Saya|❓ Bantuan)$"),
            handle_menu_button,
        )
    )

    # Fallback plain-text handler: allows natural language chat without slash commands.
    app.add_handler(chat_handler.build_text_chat_handler())

    return app
