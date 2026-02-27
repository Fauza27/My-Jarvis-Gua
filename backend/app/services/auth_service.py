from app.repositories.auth_repository import AuthRepository
from app.models.auth import UserOut, MessageOut, TokenOut

class AuthService:
    def __init__(self, auth_repo: AuthRepository):
        self._auth_repo = auth_repo
    
    def register(self, email: str, password: str, redirect_url: str) -> MessageOut:
        """Register a new user and send confirmation email."""
        self._auth_repo.register(email, password, redirect_url)
        return MessageOut(message="Registration successful. Please check your email to confirm.")
    
    def login(self, email: str, password: str) -> TokenOut:
        """Login user and return access and refresh tokens."""
        response = self._auth_repo.login(email, password)

        session = response.session
        user = response.user

        return TokenOut(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_at=session.expires_at,
            user=UserOut(
                id=str(user.id),
                email=user.email,
                created_at=str(user.created_at),
                email_confirmed=getattr(user, 'email_confirmed_at', None) is not None,
            )
        )
    
    def logout(self) -> MessageOut:
        """Logout user by revoking the access token."""
        self._auth_repo.logout()
        return MessageOut(message="Logout successful.")
    
    def refresh_session(self, refresh_token: str) -> TokenOut:
        """Refresh access token using refresh token."""
        response = self._auth_repo.refresh_session(refresh_token)

        session = response.session
        user = response.user

        return TokenOut(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_at=session.expires_at,
            user=UserOut(
                id=str(user.id),
                email=user.email,
                created_at=str(user.created_at),
                email_confirmed=getattr(user, 'email_confirmed_at', None) is not None,
            )
        )
    
    def request_password_reset(self, email: str, redirect_url: str) -> MessageOut:
        """Request password reset email."""
        self._auth_repo.request_password_reset(email, redirect_url)
        return MessageOut(message="If email is registered, password reset link will be sent.")