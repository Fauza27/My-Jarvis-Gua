from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import Client

from app.core.config import get_settings
from app.infrastructure.supabase_client import get_supabase_client
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

from app.api import auth, expense, profile, ai

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="J.A.R.V.I.S Project",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
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
    from app.core.exceptions import UnauthorizedError
    
    @app.exception_handler(AuthenticationError)
    @app.exception_handler(InvalidTokenError)
    @app.exception_handler(EmailNotConfirmedError)
    @app.exception_handler(UnauthorizedError)
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
    app.include_router(expense.router, prefix=API_PREFIX)
    app.include_router(profile.router, prefix=API_PREFIX)
    app.include_router(ai.router, prefix=API_PREFIX)
    # Health check endpoint with dependency check
    @app.get("/health", tags=["System"], summary="Health check")
    async def health_check(supabase: Client = Depends(get_supabase_client)):
        settings = get_settings()
        health_status = {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "environment": settings.APP_ENV,
        }
        
        # Check Supabase connection
        try:
            # Simple check - try to get session
            supabase.auth.get_session()
            health_status["supabase"] = "connected"
        except Exception as e:
            health_status["status"] = "unhealthy"
            health_status["supabase"] = "disconnected"
            health_status["error"] = str(e)[:100]
        
        return health_status
    
    @app.get("/")
    async def root():
        settings = get_settings()
        return {
            "message": f"Welcome to {settings.APP_NAME}",
            "version": settings.VERSION,
            "docs": "/docs" if not settings.is_production else None
        }
    