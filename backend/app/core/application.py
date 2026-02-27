from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.exceptions import (
    AppError,
    AuthenticationError,
    AuthorizationError,
    EmailNotConfirmedError,
    InvalidTokenError,
    NotFoundError,
    UserAlreadyExistsError,
    ValidationError,
)

from app.api import auth

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="J.A.R.V.I.S Project",
        docs_url="/docs" if settings.is_production else None,
        redoc_url="/redoc" if settings.is_production else None,
    )

    _register_middleware(app, settings)
    _register_exception_handlers(app)
    _register_routers(app)

    return app

def _register_middleware(app: FastAPI, settings):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def _register_exception_handlers(app: FastAPI):
    @app.exception_handler(AuthenticationError)
    @app.exception_handler(InvalidTokenError)
    @app.exception_handler(EmailNotConfirmedError)
    async def authentication_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=401,
            content={"detail": exc.message},
            headers={"WWW-Authenticate": "Bearer"},
        )

    @app.exception_handler(AuthorizationError)
    async def authorization_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=403,
            content={"detail": exc.message},
        )

    @app.exception_handler(UserAlreadyExistsError)
    async def conflict_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=409,
            content={"detail": exc.message},
        )

    @app.exception_handler(NotFoundError)
    async def not_found_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=404,
            content={"detail": exc.message},
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.message},
        )

    @app.exception_handler(AppError)
    async def generic_app_error_handler(request: Request, exc: AppError):
        """Catch-all handler for any AppError that doesn't have a specific handler."""
        return JSONResponse(
            status_code=400,
            content={"detail": exc.message},
        )

def _register_routers(app: FastAPI):
    API_PREFIX = "/api"

    app.include_router(auth.router, prefix=API_PREFIX)

    # Health check endpoint
    @app.get("/health", tags=["System"], summary="Health check")
    async def health_check():
        settings = get_settings()
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
        }
    
    @app.get("/")
    async def root():
        return {"message": "wellcome to MY-Jarvis-Gua API"}
    