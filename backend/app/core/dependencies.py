from typing import Annotated
import jwt
import logging

from fastapi import Depends, Header
from supabase import Client, AuthApiError

from app.core.config import get_settings, Settings
from app.core.exceptions import AuthenticationError, InvalidTokenError
from app.infrastructure.supabase_client import get_admin_supabase_client
from app.models.auth import UserOut

logger = logging.getLogger(__name__)

def get_app_settings() -> Settings:
    return get_settings()

def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AuthenticationError("authorization not found in header")
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header format")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise AuthenticationError("Token is missing")
    return token

def _verify_jwt_locally(token: str, settings: Settings) -> UserOut:
    try:
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return UserOut(
            id=payload["sub"],
            email=payload.get("email", ""),
            created_at=payload.get("created_at", ""),
        )
    except jwt.ExpiredSignatureError:
        raise InvalidTokenError("Token expired")
    except jwt.InvalidAudienceError:
        raise InvalidTokenError("Invalid token audience")
    except jwt.PyJWTError as e:
        logger.error(f"JWT verification failed: {str(e)[:100]}")
        raise InvalidTokenError("Invalid token")


async def get_current_user(
    authorization: Annotated[str, Header()] = None,
    admin_supabase: Client = Depends(get_admin_supabase_client),
) -> UserOut:
    if not authorization:
        raise AuthenticationError("authorization not found in header")
    
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header format")
    
    token = _extract_bearer_token(authorization)
    
    if not token:
        raise AuthenticationError("Token is missing")
    
    try:
        response = admin_supabase.auth.get_user(token)
        return response.user
    except AuthApiError as e:
        msg = str(e.message).lower()
        if any(kw in msg for kw in ["invalid", "expired", "jwt", "token"]):
            raise InvalidTokenError("Invalid or expired token")
        logger.warning("Supabase auth API error, using local JWT: %s", str(e)[:100])
    except (ConnectionError, OSError) as e:
        logger.warning("Supabase unreachable (network error), using local JWT: %s", str(e)[:100])
    except Exception as e:
        # Catch httpx.ConnectError and other transport errors without importing httpx
        error_type = type(e).__name__
        if "Connect" in error_type or "Timeout" in error_type or "Network" in error_type:
            logger.warning("Supabase connection failed (%s), using local JWT: %s", error_type, str(e)[:100])
        else:
            logger.error("Unexpected error during Supabase auth: %s - %s", error_type, str(e)[:100])
            raise
    
    settings = get_settings()
    return _verify_jwt_locally(token, settings)
           
async def get_access_token(
    authorization: Annotated[str, Header()] = None,
) -> str:
    return _extract_bearer_token(authorization)

# Type Aliases for better readability
CurrentUser = Annotated[object, Depends(get_current_user)]
AccessToken = Annotated[str, Depends(get_access_token)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]