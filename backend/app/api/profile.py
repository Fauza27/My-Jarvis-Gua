from fastapi import APIRouter, Depends, status, HTTPException
from supabase import Client
 
from app.core.dependencies import CurrentUser, AccessToken
from app.infrastructure.supabase_client import get_user_client, get_admin_supabase_client
from app.repositories.profile_repository import ProfileRepository
from app.services.profile_service import ProfileService
from app.models.profile import (
    ProfileOut, UpdateProfileRequest,
    LinkTelegramRequest, GenerateConnectCodeResponse,
)
from app.models.auth import MessageOut

router = APIRouter(prefix="/profile", tags=["Profile"])

def get_profile_service_for_user(token: AccessToken) -> ProfileService:
    """Profile service with user-context client (RLS)"""
    user_client = get_user_client(access_token=token)
    repo = ProfileRepository(client=user_client)
    return ProfileService(profile_repo=repo)

def get_profile_service_for_admin() -> ProfileService:
    """Profile service with admin client (bypass RLS)"""
    admin_client = get_admin_supabase_client()
    repo = ProfileRepository(client=admin_client)
    return ProfileService(profile_repo=repo)

@router.get(
    "/me",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Get current user's profile",
)
async def get_my_profile(
    current_user: CurrentUser,
    service: ProfileService = Depends(get_profile_service_for_user),
):
    """Get the profile of the currently authenticated user."""
    return service.get_profile(user_id=current_user.id)

@router.put(
    "/me",
    response_model=ProfileOut,
    status_code=status.HTTP_200_OK,
    summary="Update current user's profile",
)
async def update_my_profile(
    body: UpdateProfileRequest,
    current_user: CurrentUser,
    service: ProfileService = Depends(get_profile_service_for_user),
):
    """
    update the profile of the currently authenticated user.
    
    Body:
    ```json
    {
        "display_name": "New Display Name",
        "bio": "Updated bio",
    }
    ```
    """
    return service.update_profile(user_id=str(current_user.id), update_request=body)

@router.post(
    "/me/telegram/connect-code",
    response_model=GenerateConnectCodeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Telegram connect code for linking account",
    description="Generate a unique code that can be used to link a Telegram account to the user's profile. The code is valid for 10 minutes."
)
async def generate_telegram_connect_code(
    current_user: CurrentUser,
    service: ProfileService = Depends(get_profile_service_for_user),
):
    return service.generate_connect_code(user_id=str(current_user.id))

@router.post(
    "/me/telegram/link",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Link Telegram account to current user's profile",
)
async def link_telegram_account(
    body: LinkTelegramRequest,
    current_user: CurrentUser,
    service: ProfileService = Depends(get_profile_service_for_user),
):
    raise HTTPException(
        status_code=410,
        detail="Linking Telegram via web is disabled. Use /connect in Telegram with a one-time code.",
    )

@router.delete(
    "/me/telegram/unlink",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Unlink Telegram account from current user's profile"
)
async def unlink_telegram_account(
    current_user: CurrentUser,
    service: ProfileService = Depends(get_profile_service_for_user),
):
    """
    unlink Telegram account from the currently authenticated user's profile.
    """
    return service.unlink_telegram(user_id=str(current_user.id))

