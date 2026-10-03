"""Reproducible offline audit: dummy settings, blocked network, existing tests only."""
from pathlib import Path
import os
import sys
import json
import socket
import contextlib

root = Path(__file__).resolve().parents[2]
backend = root / "backend"
out = Path(os.environ.get("REMEDIATION_OUTPUT_DIR", str(Path(__file__).resolve().parent)))
out.mkdir(parents=True, exist_ok=True)
os.chdir(backend)
sys.path.insert(0, str(backend))
os.environ.update({
    "SUPABASE_URL": "https://audit.invalid",
    "SUPABASE_ANON_KEY": "audit-dummy-anon",
    "SUPABASE_SERVICE_ROLE_KEY": "audit-dummy-service",
    "SUPABASE_JWT_SECRET": "audit-dummy-secret-only-for-offline-tests-123456",
    "SUPABASE_TEST_URL": "https://audit-test.invalid",
    "SUPABASE_TEST_ANON_KEY": "audit-dummy-test-anon",
    "SUPABASE_TEST_SERVICE_ROLE_KEY": "audit-dummy-test-service",
    "OPENAI_API_KEY": "audit-dummy-openai",
    "TELEGRAM_BOT_TOKEN": "123456:audit-dummy-telegram",
    "TELEGRAM_WEBHOOK_URL": "",
    "TELEGRAM_WEBHOOK_SECRET": "",
    "ENVIRONMENT": "development",
    "ALLOWED_ORIGINS": '["http://localhost:3001"]',
    "FRONTEND_URL": "http://localhost:3001",
    "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1",
    "PYTHONDONTWRITEBYTECODE": "1",
})
os.environ.pop("RUN_INTEGRATION_TESTS", None)
import dotenv
dotenv.load_dotenv = lambda *args, **kwargs: False
from app.core.config import Settings, get_settings
Settings.model_config["env_file"] = None
get_settings.cache_clear()

def blocked(*args, **kwargs):
    raise RuntimeError("AUDIT_NETWORK_BLOCKED: external service requires a test mock")
_connect = socket.socket.connect
_connect_ex = socket.socket.connect_ex
_getaddrinfo = socket.getaddrinfo
def local_connect(original):
    def guarded(sock, address):
        # Windows asyncio creates a loopback socketpair for its internal wakeup pipe.
        if isinstance(address, tuple) and address[0] in {"127.0.0.1", "::1"}:
            return original(sock, address)
        return blocked()
    return guarded
def local_getaddrinfo(host, *args, **kwargs):
    if host in {"127.0.0.1", "::1", "localhost"}:
        return _getaddrinfo(host, *args, **kwargs)
    return blocked()
socket.socket.connect = local_connect(_connect)
socket.socket.connect_ex = local_connect(_connect_ex)
socket.getaddrinfo = local_getaddrinfo
import httpx
httpx.HTTPTransport.handle_request = blocked
httpx.AsyncHTTPTransport.handle_async_request = blocked

import pytest
sys.stdout.reconfigure(encoding="utf-8")
with (out / "remediation-backend-tests.txt").open("w", encoding="utf-8") as log, contextlib.redirect_stdout(log), contextlib.redirect_stderr(log):
    code = pytest.main([
        "tests/unit", "tests/api", "tests/security", "tests/functional",
        "tests/integration/test_auth_repository.py::TestAuthRepositoryWithControlledMock",
        "-p", "pytest_asyncio.plugin", "-o", "addopts=", "-q", "--tb=short",
        "--junitxml=" + str(out / "remediation-backend-tests.xml"),
    ])
print((out / "remediation-backend-tests.txt").read_text(encoding="utf-8")[-15000:])
sys.exit(code)
