import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.auth import MessageOut

pytestmark = pytest.mark.security


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


def _override_register(app):
    from app.api.auth import get_auth_service

    mock_service = MagicMock()
    mock_service.register.return_value = MessageOut(message="ok")
    app.dependency_overrides[get_auth_service] = lambda: mock_service


def _override_login(app):
    from app.api.auth import get_auth_service
    from app.models.auth import TokenOut, UserOut

    mock_service = MagicMock()
    mock_service.login.return_value = TokenOut(
        access_token="a",
        refresh_token="r",
        expires_at=9999999999,
        user=UserOut(
            id="user-1",
            email="user@test.com",
            created_at="2026-04-01T00:00:00+00:00",
            email_confirmed=True,
        ),
    )
    app.dependency_overrides[get_auth_service] = lambda: mock_service


class TestRateLimit:

    def test_register_rate_limit(self, app, client):
        _override_register(app)
        try:
            status_codes = []
            for _ in range(6):
                response = client.post("/api/auth/register", json={
                    "email": "rate@test.com",
                    "password": "Password123!",
                })
                status_codes.append(response.status_code)

            assert 429 in status_codes
        finally:
            app.dependency_overrides.clear()

    def test_login_rate_limit(self, app, client):
        _override_login(app)
        try:
            status_codes = []
            for _ in range(6):
                response = client.post("/api/auth/login", json={
                    "email": "rate@test.com",
                    "password": "Password123!",
                })
                status_codes.append(response.status_code)

            assert 429 in status_codes
        finally:
            app.dependency_overrides.clear()
