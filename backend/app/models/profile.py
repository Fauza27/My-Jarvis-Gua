from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator

class UpdateProfileRequest(BaseModel):
    """Request model for updating user profile."""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("display_name")
    @classmethod
    def display_name_not_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.strip()) > 100:
            raise ValueError("Display name must be 100 characters or less")
        return v.strip() if v else v
    
    @field_validator("bio")
    @classmethod
    def bio_not_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("Bio must be 500 characters or less")
        return v
    
    def to_update_dict(self) -> dict:
        """only field that not none"""
        return {k: v for k, v in self.model_dump().items() if v is not None}

class LinkTelegramRequest(BaseModel):
    """data for linking Telegram account."""
    telegram_chat_id: str

class ProfileOut(BaseModel):
    """Data profile that save for send to client."""
    id: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[HttpUrl]
    telegram_linked: bool
    auth_provider: str
    created_at: str
    updated_at: str

    @classmethod
    def from_db(cls, data: dict) -> "ProfileOut":
        """
        Factory method to create a ProfileOut instance from database data.
        hide telegram_chat_id from response(privacy reason)
        just expose status if 'have linked or not yet'.
        """
        return cls(
            id=str(data["id"]),
            display_name=data.get("display_name"),
            bio=data.get("bio"),
            avatar_url=data.get("avatar_url"),
            # if telegram chat id exist, then it's linked, otherwise not linked
            telegram_linked=data.get("telegram_chat_id") is not None,
            auth_provider=data.get("auth_provider") or "email",
            created_at=str(data.get("created_at", "")),
            updated_at=str(data.get("updated_at", ""))
        )

class GenerateConnectCodeResponse(BaseModel):
    """Response model for generating Telegram connect code."""
    code: str
    expires_in_minutes: int
    instructions: str = (
        "Open Telegram and search for @YourBotUsername, then send command\n"
        "/connect {code}\n"
    )

    @property
    def formatted_instructions(self) -> str:
        """Return instructions with the actual code."""
        return f"open telegram and type:\n/connect {self.code}"
