import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.profile import ProfileOut, GenerateConnectCodeResponse
from app.models.auth import MessageOut

pytestmark = pytest.mark.api


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_current_user():
    user = MagicMock()
    user.id = "user-uuid-123"
    user.email = "user@test.com"
    return user


def make_profile_out() -> ProfileOut:
    return ProfileOut(
        id="user-uuid-123",
        display_name="Budi",
        bio="Bio singkat",
        avatar_url=None,
        telegram_linked=False,
        auth_provider="email",
        created_at="2026-04-01T00:00:00+00:00",
        updated_at="2026-04-01T00:00:00+00:00",
    )


class TestProfileEndpoints:

    def test_get_my_profile(self, app, client, mock_current_user):
        from app.api.profile import get_profile_service_for_user
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.get_profile.return_value = make_profile_out()
        app.dependency_overrides[get_profile_service_for_user] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/profile/me")
            assert response.status_code == 200
            assert response.json()["id"] == "user-uuid-123"
        finally:
            app.dependency_overrides.clear()

    def test_update_my_profile(self, app, client, mock_current_user):
        from app.api.profile import get_profile_service_for_user
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.update_profile.return_value = make_profile_out()
        app.dependency_overrides[get_profile_service_for_user] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.put("/api/profile/me", json={"display_name": "Budi Baru"})
            assert response.status_code == 200
            assert response.json()["display_name"] == "Budi"
        finally:
            app.dependency_overrides.clear()

    def test_generate_telegram_connect_code(self, app, client, mock_current_user):
        from app.api.profile import get_profile_service_for_user
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.generate_connect_code.return_value = GenerateConnectCodeResponse(
            code="MYJARVIS-ABCDE1",
            expires_in_minutes=10,
        )
        app.dependency_overrides[get_profile_service_for_user] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.post("/api/profile/me/telegram/connect-code")
            assert response.status_code == 201
            assert response.json()["code"].startswith("MYJARVIS-")
        finally:
            app.dependency_overrides.clear()

    def test_link_telegram_is_disabled(self, app, client, mock_current_user):
        from app.api.profile import get_profile_service_for_user
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        app.dependency_overrides[get_profile_service_for_user] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        try:
            response = client.post(
                "/api/profile/me/telegram/link",
                json={"telegram_chat_id": "123"},
            )
            assert response.status_code == 410
        finally:
            app.dependency_overrides.clear()

    def test_unlink_telegram(self, app, client, mock_current_user):
        from app.api.profile import get_profile_service_for_user
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.unlink_telegram.return_value = MessageOut(message="ok")
        app.dependency_overrides[get_profile_service_for_user] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.delete("/api/profile/me/telegram/unlink")
            assert response.status_code == 200
            assert "message" in response.json()
        finally:
            app.dependency_overrides.clear()
