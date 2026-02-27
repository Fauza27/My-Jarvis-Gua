from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    # App
    APP_NAME: str = "My-Jarvis-Gua API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Database (supabase)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Redis
    #REDIS_URL: str

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OpenAI
    #OPENAI_API_KEY: str
    
    # Telegram
    #TELEGRAM_BOT_TOKEN: str
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3001"]

    # URL redirect
    FRONTEND_URL: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def auth_redirect_url(self) -> str:
        """URL redirect setelah user klik link di email"""
        return f"{self.FRONTEND_URL}/auth/callback"

    @property
    def password_reset_url(self) -> str:
        """URL halaman reset password di frontend"""
        return f"{self.FRONTEND_URL}/auth/reset-password"
    
@lru_cache()
def get_settings() -> Settings:
    return Settings()