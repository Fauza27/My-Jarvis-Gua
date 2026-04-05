import logging
from telegram import Update
from telegram.ext import ContextTypes, MessageHandler, filters
from telegram.constants import ParseMode, ChatAction
 
from app.bot import messages as msg_templates
from app.bot.handlers.auth_handler import get_linked_profile
from app.infrastructure.openai_client import get_openai_client
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.repositories.ai_repository import AIRepository
from app.repositories.expense_repository import ExpenseRepository
from app.services.expense_service import ExpenseService
from app.services.embedding_services import EmbeddingService
from app.services.voice_service import VoiceService
from app.services.ai_services import AIService
from app.models.ai import ConversationMessage
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)

PROCESSING_VOICE_MSG = "🎙️ _Sedang memproses pesan suara kamu\\.\\.\\._"


def _make_services() -> tuple[VoiceService, AIService]:
    """
    Build VoiceService and AIService using admin client (same pattern as expense_handler).
    No user token needed — identity is verified via Telegram link, 
    and all queries enforce user_id explicitly.
    """
    openai_client = get_openai_client()
    admin_client = get_admin_supabase_client()

    ai_repo = AIRepository(client=admin_client)
    embedding_service = EmbeddingService(openai_client=openai_client, ai_repo=ai_repo)
    expense_service = ExpenseService(
        expense_repo=ExpenseRepository(client=admin_client), 
        embedding_service=embedding_service
    )
    voice_service = VoiceService(openai_client=openai_client)
    ai_service = AIService(
        openai_client=openai_client,
        expense_service=expense_service,
        embedding_service=embedding_service,
        ai_repo=ai_repo
    )
    return voice_service, ai_service


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Core handler for voice messages from Telegram."""
    chat_id = update.effective_chat.id
    voice = update.message.voice

    # 1. Check if user has linked their account
    profile = await get_linked_profile(chat_id)
    if not profile:
        await update.message.reply_text(
            msg_templates.VOICE_NOT_LINKED, parse_mode=ParseMode.MARKDOWN_V2
        )
        return
    user_id = str(profile["id"])

    # 2. Show "processing" indicator
    processing_msg = await update.message.reply_text(
        PROCESSING_VOICE_MSG, parse_mode=ParseMode.MARKDOWN_V2,
    )
    await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)

    try:
        # 3. Download voice file from Telegram
        tg_file = await context.bot.get_file(voice.file_id)
        audio_bytes = bytes(await tg_file.download_as_bytearray())

        logger.info(
            f"Received voice message from user_id={user_id}, "
            f"file_id={voice.file_id}, size={len(audio_bytes)} bytes"
        )

        # 4. Build services (admin client, no user token needed)
        voice_service, ai_service = _make_services()
        
        # 5. Transcribe audio → text
        transcribed_text, error = voice_service.transcribe_safe(
            audio_bytes=audio_bytes,
            filename=f"voice_{chat_id}.ogg",
        )
 
        if error or not transcribed_text.strip():
            await _edit_message_and_inform(
                update, processing_msg,
                "❌ Maaf, tidak bisa mentranskripsikan pesan suara kamu\\.\n"
                "_Coba kirim dengan lebih jelas atau dalam kondisi yang lebih tenang\\._"
            )
            return
        
        # 6. Show transcription preview while AI processes
        preview_text = (
            f"📝 *Transkripsi:*\n"
            f"_{_escape_md(transcribed_text)}_\n\n"
            f"💬 _AI sedang merespons\\.\\.\\._"
        )
        await processing_msg.edit_text(
            preview_text,
            parse_mode=ParseMode.MARKDOWN_V2,
        )

        # 7. Send transcribed text to AI chat (with conversation history)
        history = context.user_data.get("voice_conversation_history", [])
        enhanced_message = (
            f"[Pesan suara dari user, sudah ditranskripsi]\n{transcribed_text}"
        )

        chat_response = ai_service.chat(
            user_id=user_id,
            message=enhanced_message,
            conversation_history=[
                ConversationMessage(role=m["role"], content=m["content"])
                for m in history
            ],
        )

        # 8. Save conversation history (keep last 10 messages)
        context.user_data["voice_conversation_history"] = [
            {"role": m.role, "content": m.content}
            for m in chat_response.conversation_history[-10:]
        ]

        # 9. Show final response
        final_text = (
            f"📝 *Transkripsi:*\n"
            f"_{_escape_md(transcribed_text)}_\n\n"
            f"🤖 *AI:*\n{_escape_md(chat_response.reply)}"
        )
 
        await processing_msg.edit_text(
            final_text,
            parse_mode=ParseMode.MARKDOWN_V2,
        )
 
        if chat_response.action_taken:
            logger.info(
                f"Voice → AI actions: {chat_response.action_taken}, user={user_id}"
            )
 
    except AppError as e:
        logger.error(f"Voice handler AppError: {e.message}")
        await _edit_message_and_inform(
            update, processing_msg,
            f"❌ {_escape_md(e.message)}"
        )
    except Exception as e:
        logger.error(f"Voice handler unexpected error: {e}", exc_info=True)
        await _edit_message_and_inform(
            update, processing_msg,
            "⚠️ Terjadi kesalahan yang tidak terduga\\. Coba lagi ya\\!"
        )

async def _edit_message_and_inform(update, message, text: str) -> None:
    """Edit loading message to error message."""
    try:
        await message.edit_text(text, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception:
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN_V2)
 
 
def _escape_md(text: str) -> str:
    """Escape special characters for Telegram MarkdownV2."""
    special_chars = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{c}" if c in special_chars else c for c in text)
 
 
def build_voice_handler() -> MessageHandler:
    """Factory function to create MessageHandler for voice messages."""
    return MessageHandler(filters.VOICE, handle_voice)