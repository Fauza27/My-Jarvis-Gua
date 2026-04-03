from functools import lru_cache
from openai import OpenAI
from app.core.config import get_settings

@lru_cache
def get_openai_client() -> OpenAI:
    """Initialize and return an OpenAI client instance."""
    settings = get_settings()
    return OpenAI(api_key=settings.OPENAI_API_KEY)