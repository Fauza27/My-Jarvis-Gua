import logging

from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import ContextTypes, MessageHandler, filters

from app.bot import messages as msg_templates
from app.bot.handlers.auth_handler import get_linked_profile
from app.core.exceptions import AppError
from app.infrastructure.openai_client import get_openai_client
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.models.ai import ConversationMessage
from app.repositories.ai_repository import AIRepository
from app.repositories.expense_repository import ExpenseRepository
from app.services.ai_services import AIService
from app.services.embedding_services import EmbeddingService
from app.services.expense_service import ExpenseService

logger = logging.getLogger(__name__)

HISTORY_KEY = "text_conversation_history"
MAX_HISTORY_ITEMS = 12


def _escape_md(text: str) -> str:
    """Escape special characters for Telegram MarkdownV2."""
    special_chars = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{c}" if c in special_chars else c for c in str(text))


def _make_ai_service(user_id: str) -> AIService:
    """
    Creates an AIService instance for the bot.
    NOTE: We use the admin_client (service_role) here because the bot 
    does not have a user JWT context. RLS is bypassed, so ALL database 
    queries must explicitly filter by the provided user_id.
    """
    assert user_id, "user_id is required to prevent cross-user data leakage"
    admin_client = get_admin_supabase_client()
    openai_client = get_openai_client()
    
    expense_service = ExpenseService(
        expense_repo=ExpenseRepository(client=admin_client),
        embedding_service=EmbeddingService(openai_client=openai_client, ai_repo=AIRepository(client=admin_client)),
    )
    profile_repo = ProfileRepository(client=admin_client)
    ai_repo = AIRepository(client=admin_client)
    
    return AIService(
        openai_client=openai_client,
        expense_service=expense_service,
        profile_repo=profile_repo,
        ai_repo=ai_repo,
    )


def _load_history(context: ContextTypes.DEFAULT_TYPE) -> list[ConversationMessage]:
    """Load serialized history from Telegram context into ConversationMessage list."""
    raw_history = context.user_data.get(HISTORY_KEY, [])
    history: list[ConversationMessage] = []

    for item in raw_history:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str):
            history.append(ConversationMessage(role=role, content=content))

    return history


def _save_history(context: ContextTypes.DEFAULT_TYPE, history: list[ConversationMessage]) -> None:
    """Persist only a bounded amount of history to avoid unbounded growth."""
    context.user_data[HISTORY_KEY] = [
        {"role": m.role, "content": m.content}
        for m in history[-MAX_HISTORY_ITEMS:]
    ]


async def handle_text_chat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle plain text messages and route them to AI chat + tools."""
    if not update.message:
        return

    text = (update.message.text or "").strip()
    if not text:
        return

    chat_id = update.effective_chat.id
    profile = await get_linked_profile(chat_id)
    if not profile:
        await update.message.reply_text(
            msg_templates.NOT_CONNECTED,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
        return

    user_id = str(profile["id"])

    try:
        await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)

        ai_service = _make_ai_service(user_id)
        history = _load_history(context)
        response = ai_service.chat(
            user_id=user_id,
            message=text,
            conversation_history=history,
        )

        _save_history(context, response.conversation_history)

        reply_text = (response.reply or "").strip()
        if not reply_text:
            reply_text = "Maaf, saya belum bisa menjawab sekarang."

        await update.message.reply_text(
            f"🤖 {_escape_md(reply_text)}",
            parse_mode=ParseMode.MARKDOWN_V2,
        )

        if response.action_taken:
            logger.info("Text chat -> AI actions: %s, user=%s", response.action_taken, user_id)

    except AppError as exc:
        logger.error("Text chat AppError: %s", exc.message)
        await update.message.reply_text(
            msg_templates.UNEXPECTED_ERROR,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
    except Exception:
        logger.exception("Unexpected error in text chat handler")
        await update.message.reply_text(
            msg_templates.UNEXPECTED_ERROR,
            parse_mode=ParseMode.MARKDOWN_V2,
        )


def build_text_chat_handler() -> MessageHandler:
    """Factory for plain-text AI chat handler (non-command messages)."""
    return MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_chat)