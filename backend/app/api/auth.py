from fastapi import APIRouter, Depends, status, Response, Cookie, Request
from supabase import Client, AuthApiError
import time

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, AccessToken
from app.core.exceptions import AuthenticationError, InvalidTokenError
from app.infrastructure.supabase_client import get_supabase_client, get_admin_supabase_client
from app.repositories.auth_repository import AuthRepository
from app.services.auth_service import AuthService
from app.models.auth import (
    RegisterRequest,
    LoginRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    SessionSyncRequest,
    TokenOut,
    MessageOut,
)
from app.core.rate_limit import limiter

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, expires_at: int) -> None:
    settings = get_settings()
    now = int(time.time())
    max_age = max(expires_at - now, 0)

    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.is_production,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=max_age,
        path="/",
    )
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

def _clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(settings.ACCESS_TOKEN_COOKIE_NAME, path="/")
    response.delete_cookie(settings.REFRESH_TOKEN_COOKIE_NAME, path="/")

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_auth_service(
    supabase: Client = Depends(get_supabase_client),
    admin_supabase: Client = Depends(get_admin_supabase_client),
) -> AuthService:
    auth_repo = AuthRepository(client=supabase, admin_client=admin_supabase)
    return AuthService(auth_repo)

@router.post(
    "/register",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit("5/minute")
async def register(
    request: Request,
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
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    token_out = service.login(email=body.email, password=body.password)
    _set_auth_cookies(response, token_out.access_token, token_out.refresh_token, token_out.expires_at)
    
    settings = get_settings()
    if settings.is_production:
        token_out.access_token = ""
        token_out.refresh_token = ""
        
    return token_out

@router.post(
    "/logout",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Logout user by revoking the access token",
)
async def logout(
    _current_user: CurrentUser,
    access_token: AccessToken,
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    message = service.logout(access_token=access_token)
    _clear_auth_cookies(response)
    return message

@router.post(
    "/refresh",
    response_model=TokenOut,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token using refresh token",
)
async def refresh_token(
    response: Response,
    body: RefreshTokenRequest | None = None,
    refresh_token_cookie: str | None = Cookie(default=None, alias="refresh_token"),
    service: AuthService = Depends(get_auth_service),
):
    refresh_token = body.refresh_token if body else None
    refresh_token = refresh_token or refresh_token_cookie
    if not refresh_token:
        raise AuthenticationError("Refresh token is missing")

    token_out = service.refresh_session(refresh_token=refresh_token)
    _set_auth_cookies(response, token_out.access_token, token_out.refresh_token, token_out.expires_at)
    
    settings = get_settings()
    if settings.is_production:
        token_out.access_token = ""
        token_out.refresh_token = ""
        
    return token_out

@router.post(
    "/session",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Sync OAuth session tokens into HttpOnly cookies",
)
async def sync_session(
    body: SessionSyncRequest,
    response: Response,
    admin_supabase: Client = Depends(get_admin_supabase_client),
):
    try:
        admin_supabase.auth.get_user(body.access_token)
    except AuthApiError as e:
        msg = str(e.message).lower()
        if any(kw in msg for kw in ["invalid", "expired", "jwt", "token"]):
            raise InvalidTokenError("Invalid or expired token")
        raise

    _set_auth_cookies(response, body.access_token, body.refresh_token, body.expires_at)
    return MessageOut(message="Session synchronized")

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
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    settings = get_settings()
    return service.request_password_reset(
        email=body.email,
        redirect_url=settings.password_reset_redirect_url,
    )

