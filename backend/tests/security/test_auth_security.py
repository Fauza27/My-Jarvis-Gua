import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.auth import TokenOut, UserOut, MessageOut
from app.core.exceptions import AuthenticationError

pytestmark = pytest.mark.security


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


def make_token_out() -> TokenOut:
    return TokenOut(
        access_token="access.jwt",
        refresh_token="refresh.jwt",
        expires_at=9999999999,
        user=UserOut(
            id="user-1",
            email="user@test.com",
            created_at="2026-04-01T00:00:00+00:00",
            email_confirmed=True,
        ),
    )


class TestAuthSecurity:

    def test_protected_endpoint_requires_auth(self, client):
        response = client.get("/api/profile/me")
        assert response.status_code == 401

    def test_expense_requires_auth(self, client):
        response = client.get("/api/expenses")
        assert response.status_code == 401

    def test_refresh_requires_token(self, client):
        response = client.post("/api/auth/refresh", json={})
        assert response.status_code == 401

    def test_login_masks_tokens_in_production(self, app, client, monkeypatch):
        from app.api.auth import get_auth_service
        import app.api.auth as auth_module
        from app.core.rate_limit import limiter

        class StubSettings:
            is_production = True
            ACCESS_TOKEN_COOKIE_NAME = "access_token"
            REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
            AUTH_COOKIE_SAMESITE = "lax"
            REFRESH_TOKEN_EXPIRE_DAYS = 7

        mock_service = MagicMock()
        mock_service.login.return_value = make_token_out()
        app.dependency_overrides[get_auth_service] = lambda: mock_service

        monkeypatch.setattr(auth_module, "get_settings", lambda: StubSettings())

        try:
            # Reset limiter state to avoid cross-test 429s from prior auth calls.
            if hasattr(limiter, "reset"):
                limiter.reset()
            elif hasattr(limiter, "_storage") and hasattr(limiter._storage, "clear"):
                limiter._storage.clear()

            response = client.post("/api/auth/login", json={
                "email": "user@test.com",
                "password": "Password123!",
            })
            assert response.status_code == 200
            body = response.json()
            assert body["access_token"] == ""
            assert body["refresh_token"] == ""
            set_cookie = response.headers.get("set-cookie", "")
            assert "httponly" in set_cookie.lower()
        finally:
            app.dependency_overrides.clear()

    def test_verify_returns_401_when_auth_fails(self, app, client):
        from app.core.dependencies import get_current_user

        async def _raise_auth():
            raise AuthenticationError("invalid")

        app.dependency_overrides[get_current_user] = _raise_auth
        try:
            response = client.get("/api/auth/verify")
            assert response.status_code == 401
        finally:
            app.dependency_overrides.clear()
