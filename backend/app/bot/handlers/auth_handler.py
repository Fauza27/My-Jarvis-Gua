from starlette.concurrency import run_in_threadpool
# =============================================================================
# app/bot/handlers/auth_handler.py — Bot Auth Handler
#
# TANGGUNG JAWAB:
#   Mengelola flow /start, /connect, /disconnect di Telegram Bot.
#
# FLOW /connect (single-step):
#   User: /connect MYJARVIS-AB12CD
#   Bot: verifikasi kode one-time lalu link telegram_chat_id
# =============================================================================

import logging

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes
from telegram.helpers import escape_markdown

from app.bot import messages
from app.bot.keyboards import main_menu_keyboard
from app.core.exceptions import AppError, AuthenticationError
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.repositories.profile_repository import ProfileRepository
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)


def _make_profile_repo_admin() -> ProfileRepository:
    return ProfileRepository(client=get_admin_supabase_client())


def _make_profile_service_admin() -> ProfileService:
    return ProfileService(profile_repo=_make_profile_repo_admin())


async def get_linked_profile(telegram_chat_id: int) -> dict | None:
    """Return linked profile by Telegram chat ID, or None if not linked."""
    profile_repo = _make_profile_repo_admin()
    return await run_in_threadpool(profile_repo.find_by_telegram_id, telegram_chat_id)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handler for /start with linked/unlinked branching message."""
    user = update.effective_user
    chat_id = update.effective_chat.id

    profile = await get_linked_profile(chat_id)

    if profile:
        await update.message.reply_text(
            messages.ALREADY_CONNECTED.format(
                display_name=escape_markdown(profile.get("display_name") or user.first_name, version=2)
            ),
            parse_mode=ParseMode.MARKDOWN_V2,
            reply_markup=main_menu_keyboard(),
        )
    else:
        await update.message.reply_text(
            messages.WELCOME.format(first_name=escape_markdown(user.first_name, version=2)),
            parse_mode=ParseMode.MARKDOWN_V2,
        )


async def cmd_connect(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Link Telegram account using one-time code from web app."""
    chat_id = update.effective_chat.id

    profile = await get_linked_profile(chat_id)
    if profile:
        await update.message.reply_text(
            messages.ALREADY_CONNECTED.format(
                display_name=escape_markdown(profile.get("display_name") or "kamu", version=2)
            ),
            parse_mode=ParseMode.MARKDOWN_V2,
            reply_markup=main_menu_keyboard(),
        )
        return

    # Ambil kode: bisa dari argumen command (/connect KODE), atau direct text (jika user hanya paste kode)
    code = ""
    if context.args:
        code = context.args[0].strip()
    elif update.message and update.message.text:
        text = update.message.text.strip()
        if text.startswith("MYJARVIS-"):
            code = text

    if not code:
        await update.message.reply_text(
            messages.ASK_CONNECT_CODE,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return

    try:
        profile_service = _make_profile_service_admin()
        await run_in_threadpool(profile_service.verify_and_link_telegram, code=code, telegram_chat_id=chat_id)

        linked_profile = await get_linked_profile(chat_id)
        display_name = (linked_profile or {}).get("display_name") or "kamu"

        await update.message.reply_text(
            messages.CONNECT_SUCCESS.format(display_name=escape_markdown(display_name, version=2)),
            parse_mode=ParseMode.MARKDOWN_V2,
            reply_markup=main_menu_keyboard(),
        )
    except AuthenticationError:
        await update.message.reply_text(
            messages.CONNECT_FAILED_INVALID_CODE,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
    except AppError as e:
        logger.error("Connect code error: %s", e.message)
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected error during /connect")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


async def cmd_disconnect(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Unlink Telegram account from profile."""
    chat_id = update.effective_chat.id

    profile = await get_linked_profile(chat_id)
    if not profile:
        await update.message.reply_text(
            messages.DISCONNECT_NOT_CONNECTED,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return

    try:
        profile_repo = _make_profile_repo_admin()
        await run_in_threadpool(profile_repo.unlink_telegram, user_id=profile["id"])

        context.user_data.clear()

        await update.message.reply_text(
            messages.DISCONNECT_SUCCESS,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
    except AppError:
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        logger.exception("Unexpected error during /disconnect")
        await update.message.reply_text(messages.UNEXPECTED_ERROR, parse_mode=ParseMode.MARKDOWN_V2)


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generic cancel response for non-conversation commands."""
    await update.message.reply_text(messages.CANCELLED, parse_mode=ParseMode.MARKDOWN_V2)
