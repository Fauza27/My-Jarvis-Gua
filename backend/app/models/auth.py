from pydantic import BaseModel, EmailStr, field_validator, Field

class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        # Normalize email
        value = value.lower().strip()
        
        # Additional validation
        if len(value) > 254:
            raise ValueError("Email too long (max 254 characters)")
        
        # Check for suspicious patterns
        if ".." in value or value.startswith(".") or value.endswith("."):
            raise ValueError("Invalid email format")
        
        return value

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) > 128:
            raise ValueError("Password too long (max 128 characters)")
        
        errors = []
        if len(value) < 8:
            errors.append("minimum 8 characters")
        if not any(c.isupper() for c in value):
            errors.append("minimum 1 uppercase letter")
        if not any(c.islower() for c in value):
            errors.append("minimum 1 lowercase letter")
        if not any(c.isdigit() for c in value):
            errors.append("minimum 1 digit")
        if not any(c in "!@#$%^&*(),.?\":{}|<>" for c in value):
            errors.append("minimum 1 special character")

        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        
        return value

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "fauza@gmail.com",
                "password": "Password123!"
            }
        }
    }

class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return value.lower().strip()

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "fauza@gmail.com",
                "password": "Password123!"
            }
        }
    }

class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return value.lower().strip()

class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None

class SessionSyncRequest(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int

class UserOut(BaseModel):
    id: str
    email: EmailStr
    created_at: str
    email_confirmed: bool = False

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int
    token_type: str = "bearer"
    user: UserOut

class MessageOut(BaseModel):
    message: str