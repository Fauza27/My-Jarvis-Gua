from supabase import AuthApiError, Client
import logging

from app.core.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    EmailNotConfirmedError,
    UserAlreadyExistsError
)

logger = logging.getLogger(__name__)

class AuthRepository:
    def __init__(self, client: Client, admin_client: Client | None = None):
        self._client = client
        self._admin_client = admin_client
    
    def register(self, email: str, password: str, redirect_url: str) -> object:
        """Register a new user with email and password."""
        try:
            response = self._client.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                    "options": {
                        "emailRedirectTo": redirect_url
                    }
                }
            )
            return response
        except AuthApiError as e:
            error_msg = str(e.message).lower()
            if (
                "already registered" in error_msg
                or "already exists" in error_msg
                or "alredy registered" in error_msg
            ):
                raise UserAlreadyExistsError("User with this email already exists.")
            raise AuthenticationError(f"Failed to register user: {e.message}")
    
    def login(self, email: str, password: str) -> object:
        """Login user with email and password."""
        try:
            response = self._client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            return response
        except AuthApiError as e:
            error_msg = str(e.message).lower()
            if "email not confirmed" in error_msg:
                raise EmailNotConfirmedError(
                    "Email not confirmed. Please check your inbox."
                )
            raise AuthenticationError(
                "Invalid email or password."
            )
    
    def logout(self, access_token: str) -> None:
        """Logout user by revoking the access token."""
        try:
            if self._admin_client:
                self._admin_client.auth.admin.sign_out(access_token)
                return

            self._client.auth.sign_out()
        except AuthApiError as e:
            logger.warning("Failed to revoke session during logout: %s", str(e.message))
        except Exception as e:
            logger.warning("Unexpected logout revoke error: %s", str(e))
    
    def refresh_session(self, refresh_token: str) -> object:
        """Refresh access token using refresh token."""
        try:
            return self._client.auth.refresh_session(refresh_token)
        except AuthApiError:
            raise InvalidTokenError(
                "Refresh token is invalid or expired. Please login again."
            )

    def request_password_reset(self, email: str, redirect_url: str) -> None:
        """Request password reset by sending email with reset link. The link will redirect to frontend page where user can enter new password."""
        try:
            self._client.auth.reset_password_for_email(
                email,
                options={"redirect_to": redirect_url},
            )
        except AuthApiError as e:
            logger.info("Password reset request failed for provided email: %s", str(e.message))

    def get_user_by_token(self, access_token: str) -> object:
        """Get user information from access token. This can be used to get current logged in user in protected routes."""
        try:
            response = self._client.auth.get_user(access_token)
            return response.user
        except AuthApiError:
            raise InvalidTokenError("Token is invalid or expired.")
    