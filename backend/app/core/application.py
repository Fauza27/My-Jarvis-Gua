import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from supabase import Client
from telegram import Update

from app.core.rate_limit import limiter

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
from app.bot.application import create_bot, post_init

logger = logging.getLogger(__name__)


# =============================================================================
# Lifespan — manages Telegram bot startup/shutdown alongside FastAPI
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the Telegram bot lifecycle within FastAPI."""
    settings = get_settings()

    if settings.TELEGRAM_WEBHOOK_URL:
        # --- STARTUP: Initialize bot & register webhook with Telegram ---
        bot_app = create_bot()
        await bot_app.initialize()

        # Set bot commands (previously done via post_init in polling mode)
        await post_init(bot_app)

        webhook_url = f"{settings.TELEGRAM_WEBHOOK_URL}{settings.TELEGRAM_WEBHOOK_PATH}"
        await bot_app.bot.set_webhook(
            url=webhook_url,
            secret_token=settings.TELEGRAM_WEBHOOK_SECRET or None,
            drop_pending_updates=True,
        )
        await bot_app.start()

        # Store bot_app in FastAPI state so the webhook endpoint can access it
        app.state.bot_app = bot_app
        logger.info("Telegram bot started in WEBHOOK mode → %s", webhook_url)
    else:
        logger.warning(
            "TELEGRAM_WEBHOOK_URL not set — bot will NOT start. "
            "Set it in .env for webhook mode."
        )

    yield  # App is running and serving requests

    # --- SHUTDOWN: Clean up bot resources ---
    if hasattr(app.state, "bot_app"):
        try:
            await app.state.bot_app.stop()
            await app.state.bot_app.shutdown()
            logger.info("Telegram bot shut down gracefully.")
        except Exception:
            logger.exception("Error shutting down Telegram bot")


# =============================================================================
# FastAPI Application Factory
# =============================================================================

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="J.A.R.V.I.S Project",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )
    
    app.state.limiter = limiter

    _register_middleware(app, settings)
    _register_exception_handlers(app)
    _register_routers(app)

    return app

def _register_middleware(app: FastAPI, settings):
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def _register_exception_handlers(app: FastAPI):
    from app.core.exceptions import UnauthorizedError
    
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
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

    # -------------------------------------------------------------------------
    # Telegram Webhook Endpoint
    # -------------------------------------------------------------------------
    @app.post(
        "/api/telegram/webhook",
        tags=["Telegram"],
        summary="Telegram webhook receiver",
        include_in_schema=False,
    )
    async def telegram_webhook(request: Request):
        """Receive updates from Telegram via webhook.

        Telegram sends a POST request with the update payload whenever a user
        interacts with the bot. The secret token header is validated to ensure
        the request genuinely originates from Telegram.
        """
        settings = get_settings()

        # Validate the secret token header
        if settings.TELEGRAM_WEBHOOK_SECRET:
            incoming_token = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            if incoming_token != settings.TELEGRAM_WEBHOOK_SECRET:
                raise HTTPException(status_code=403, detail="Invalid secret token")

        # Ensure bot is available
        if not hasattr(request.app.state, "bot_app"):
            raise HTTPException(status_code=503, detail="Bot not initialized")

        # Deserialize and process the update
        data = await request.json()
        bot_app = request.app.state.bot_app
        update = Update.de_json(data=data, bot=bot_app.bot)
        await bot_app.process_update(update)

        return JSONResponse(content={"ok": True})

    # -------------------------------------------------------------------------
    # Health check endpoint with dependency check
    # -------------------------------------------------------------------------
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

        # Check Telegram bot status
        if hasattr(app.state, "bot_app"):
            health_status["telegram_bot"] = "running"
        else:
            health_status["telegram_bot"] = "not started"
        
        return health_status
    
    @app.get("/")
    async def root():
        settings = get_settings()
        return {
            "message": f"Welcome to {settings.APP_NAME}",
            "version": settings.VERSION,
            "docs": "/docs" if not settings.is_production else None
        }