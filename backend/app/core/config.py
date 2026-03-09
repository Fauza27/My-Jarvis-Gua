from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, ValidationInfo
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
    SUPABASE_JWT_SECRET: str  # JWT secret for token verification

    SUPABASE_TEST_URL: str
    SUPABASE_TEST_SERVICE_ROLE_KEY: str
    SUPABASE_TEST_ANON_KEY: str
    
    @field_validator("SUPABASE_URL", "SUPABASE_TEST_URL", mode='after')
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value:
            raise ValueError("Supabase URL is required")
        if not value.startswith("https://"):
            raise ValueError("Supabase URL must use HTTPS")
        return value
    
    @field_validator("SUPABASE_JWT_SECRET", mode='after')
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if not value:
            raise ValueError("SUPABASE_JWT_SECRET is required for token verification")
        if len(value) < 32:
            raise ValueError("SUPABASE_JWT_SECRET seems too short")
        return value

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
    
    @field_validator("ALLOWED_ORIGINS", mode='after')
    @classmethod
    def validate_cors(cls, value: List[str], info: ValidationInfo) -> List[str]:
        # Get environment from values
        env = info.data.get("ENVIRONMENT", "development")
        
        # Don't allow wildcard in production
        if "*" in value and env == "production":
            raise ValueError("Wildcard CORS (*) not allowed in production")
        
        return value

    # URL redirect
    FRONTEND_URL: str = "http://localhost:3001"
    
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
        return f"{self.FRONTEND_URL}/callback"

    @property
    def password_reset_url(self) -> str:
        """URL halaman reset password di frontend"""
        return f"{self.FRONTEND_URL}/reset-password"
    
    @property
    def password_reset_redirect_url(self) -> str:
        """Alias for password_reset_url for compatibility."""
        return self.password_reset_url
    
    @property
    def APP_ENV(self) -> str:
        """Alias for ENVIRONMENT for compatibility."""
        return self.ENVIRONMENT
    
@lru_cache()
def get_settings() -> Settings:
    return Settings()