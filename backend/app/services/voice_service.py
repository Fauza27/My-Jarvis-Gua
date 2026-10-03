import io
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

class VoiceService:
    """Service for handling voice-related operations."""

    WHISPER_MODEL = "whisper-1"

    def __init__(self, openai_client: OpenAI):
        self._openai = openai_client
    
    def transcribe(self, audio_bytes: bytes, filename: str = "voice.ogg") -> str:
        """Transcribe audio bytes using OpenAI's Whisper model."""
        if not audio_bytes or len(audio_bytes) > 10 * 1024 * 1024:
            raise ValueError("Voice file must be between 1 byte and 10 MB")
        audio_file = io.BytesIO(audio_bytes)
        logger.info(
            f"Transcribing audio file: {len(audio_bytes)} bytes, filename: {filename}"
        )

        response = self._openai.audio.transcriptions.create(
            model = self.WHISPER_MODEL,
            file=(filename, audio_file, "audio/ogg"),
            language="id",
            response_format="text"
        )

        transcribed = str(response).strip()
        logger.info(f"Transcription result: {transcribed[:100]}...")
        return transcribed
    
    def transcribe_safe(
        self, audio_bytes: bytes, filename: str = "voice.ogg"
    ) -> tuple[str, str | None]:
        """ safe version of transcribe() - not raise exception, return (transcribed_text, error_message) """
        try:
            text = self.transcribe(audio_bytes, filename)
            return text, None
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            return "", str(e)
