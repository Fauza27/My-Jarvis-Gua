from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import get_settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=get_settings().RATE_LIMIT_STORAGE_URI,
    # Keep a Redis outage visible; silently falling back to per-process memory
    # would multiply the configured quota across replicas.
    in_memory_fallback_enabled=False,
)
