from typing import Annotated
import jwt
import time
import logging

from fastapi import Depends, Header
from supabase import Client

from app.core.config import get_settings, Settings
from app.core.exceptions import AuthenticationError, InvalidTokenError
from app.infrastructure.supabase_client import get_supabase_client, get_admin_supabase_client
from app.models.auth import UserOut

logger = logging.getLogger(__name__)

def get_app_settings() -> Settings:
    return get_settings()

async def get_current_user(
    authorization: Annotated[str, Header()] = None,
    admin_supabase: Client = Depends(get_admin_supabase_client),
):
    if not authorization:
        raise AuthenticationError("authorization not found in header")
    
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header format")
    
    token = authorization.removeprefix("Bearer ").strip()
    
    if not token:
        raise AuthenticationError("Token is missing")
    
    try:
        # Try to get user from Supabase first
        response = admin_supabase.auth.get_user(token)
        return response.user
    except Exception as e:
        # If get_user fails, verify JWT manually with SIGNATURE CHECK
        logger.info(f"get_user failed, trying JWT verification: {str(e)[:100]}")
        
        try:
            settings = get_settings()
            
            # CRITICAL: VERIFY JWT signature
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "ES256"],  # Supabase uses both
                audience="authenticated",
                options={
                    "verify_signature": True,  # ✅ MUST BE TRUE
                    "verify_exp": True,
                    "verify_aud": True,
                }
            )
            
            # Additional validation
            current_time = time.time()
            if decoded.get("exp", 0) < current_time:
                raise InvalidTokenError("Token expired")
            
            if decoded.get("aud") != "authenticated":
                raise InvalidTokenError("Invalid audience")
            
            # Create user object from verified JWT
            user = UserOut(
                id=decoded.get("sub", ""),
                email=decoded.get("email", ""),
                created_at=decoded.get("created_at", ""),
                email_confirmed=True
            )
            
            logger.info(f"JWT verified successfully for user: {user.id}")
            return user
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise InvalidTokenError("Token expired")
        except jwt.InvalidAudienceError:
            logger.warning("Invalid token audience")
            raise InvalidTokenError("Invalid token audience")
        except jwt.InvalidSignatureError:
            logger.error("Invalid token signature - possible attack!")
            raise InvalidTokenError("Invalid token signature")
        except jwt.DecodeError:
            logger.error("Invalid token format")
            raise InvalidTokenError("Invalid token format")
        except Exception as jwt_error:
            logger.error(f"JWT verification failed: {str(jwt_error)[:100]}")
            raise InvalidTokenError("Invalid or expired token") from e
    
async def get_access_token(
    authorization: Annotated[str, Header()] = None,
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("authorization not found in header")
    
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise AuthenticationError("Token is missing")
    return token

# Type Aliases for better readability
CurrentUser = Annotated[object, Depends(get_current_user)]
AccessToken = Annotated[str, Depends(get_access_token)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]