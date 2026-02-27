from fastapi import APIRouter, Depends, status
from supabase import Client

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, AccessToken
from app.infrastructure.supabase_client import get_supabase_client
from app.repositories.auth_repository import AuthRepository
from app.services.auth_service import AuthService
from app.models.auth import (
    RegisterRequest,
    LoginRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    TokenOut,
    MessageOut,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_auth_service(
    supabase: Client = Depends(get_supabase_client),
) -> AuthService:
    auth_repo = AuthRepository(supabase)
    return AuthService(auth_repo)

@router.post(
    "/register",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.register(
        email=body.email,
        password=body.password,
        redirect_url=settings.auth_redirect_url,
    )

@router.post(
    "/login",
    response_model=TokenOut,
    status_code=status.HTTP_200_OK,
    summary="Login user and get access token",
)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    return service.login(email=body.email, password=body.password)

@router.post(
    "/logout",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Logout user by revoking the access token",
)
async def logout(
    _current_user: CurrentUser,
    service: AuthService = Depends(get_auth_service),
):
    return service.logout()

@router.post(
    "/refresh",
    response_model=TokenOut,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token using refresh token",
)
async def refresh_token(
    body: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    return service.refresh_session(refresh_token=body.refresh_token)

@router.post(
    "/reset-password",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Request password reset email",
)
async def reset_password(
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.request_password_reset(
        email=body.email,
        redirect_url=settings.password_reset_redirect_url,
    )

@router.get(
    "/verify",
    status_code=status.HTTP_200_OK,
    summary="verify access token and get current user info",
)
async def verify_token(
    current_user: CurrentUser,
):
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
    }

@router.post(
    "/forgot-password",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Request password reset email",
)
async def forgot_password(
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.request_password_reset(
        email=body.email,
        redirect_url=settings.password_reset_url,
    )