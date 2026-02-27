from typing import Annotated

from fastapi import Depends, Header
from supabase import Client

from app.core.config import get_settings, Settings
from app.core.exceptions import AuthenticationError, InvalidTokenError
from app.infrastructure.supabase_client import get_supabase_client, get_admin_supabase_client

def get_app_settings() -> Settings:
    return get_settings()

async def get_current_user(
    authorization: Annotated[str, Header()] = None,
    supabase: Client = Depends(get_supabase_client),
):
    if not authorization:
        raise AuthenticationError("authorization not found in header")
    
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header format")
    
    token = authorization.removeprefix("Bearer ").strip()
    
    if not token:
        raise AuthenticationError("Token is missing")
    
    try:
        response = supabase.auth.api.get_user(token)
        return response.user
    except Exception as e:
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