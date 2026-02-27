from pydantic import BaseModel, EmailStr, field_validator

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        errors = []
        if len(value) < 8:
            errors.append("minimum 8 characters")
        if not any(c.isupper() for c in value):
            errors.append("minimum 1 uppercase letter")
        if not any(c.islower() for c in value):
            errors.append("minimum 1 lowercase letter")
        if not any(c.isdigit() for c in value):
            errors.append("minimum 1 digit")

        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        return value

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "fauza@gmail.com",
                "password": "Password123"
            }
        }
    }

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "fauza@gmail.com",
                "password": "Password123"
            }
        }
    }

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class RefreshTokenRequest(BaseModel):
    refresh_token: str

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