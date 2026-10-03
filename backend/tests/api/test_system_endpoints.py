import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app

pytestmark = pytest.mark.api


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


class TestSystemEndpoints:

    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_health_connected(self, app, client):
        from app.infrastructure.supabase_client import get_admin_supabase_client

        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = MagicMock(data=[])
        app.dependency_overrides[get_admin_supabase_client] = lambda: mock_supabase

        try:
            response = client.get("/health")
            assert response.status_code == 200
            assert response.json()["status"] == "healthy"
        finally:
            app.dependency_overrides.clear()

    def test_health_disconnected(self, app, client):
        from app.infrastructure.supabase_client import get_admin_supabase_client

        mock_supabase = MagicMock()
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.side_effect = Exception("boom")
        app.dependency_overrides[get_admin_supabase_client] = lambda: mock_supabase

        try:
            response = client.get("/health")
            assert response.status_code == 503
            body = response.json()
            assert body["status"] == "unhealthy"
            assert body["supabase"] == "disconnected"
        finally:
            app.dependency_overrides.clear()
