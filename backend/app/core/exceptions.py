class AppError(Exception):
    """Base class for application exceptions."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

class AuthenticationError(AppError):
    """Raised when authentication fails."""
    pass

class AuthorizationError(AppError):
    """Raised when user is not authorized to perform an action."""
    pass

class UserAlreadyExistsError(AppError):
    """Raised when trying to create a user that already exists."""
    pass

class EmailNotConfirmedError(AppError):
    """Raised when user tries to login but email is not confirmed."""
    pass

class InvalidTokenError(AppError):
    """Raised when JWT token is invalid or expired."""
    pass

class NotFoundError(AppError):
    """Raised when a requested resource is not found."""
    pass

class ValidationError(AppError):
    """Raised when input data fails validation."""
    pass

class UnauthorizedError(AppError):
    """Raised when user is not authorized (401)."""
    pass

class TelehgramNotLinkedError(AppError):
    """Raised when user tries to access Telegram features but hasn't linked their account."""
    pass

class TelegramAlreadyLinkedError(AppError):
    """Raised when user tries to link Telegram but it's already linked to another account."""
    pass