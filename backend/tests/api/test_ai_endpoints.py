import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.ai import ChatResponse, SemanticSearchResponse, SearchResultItem

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


class TestAIEndpoints:

    def test_chat_endpoint(self, app, client, mock_current_user):
        from app.api.ai import get_ai_services
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.chat.return_value = ChatResponse(
            reply="Halo!",
            conversation_history=[],
            action_taken=[],
        )
        app.dependency_overrides[get_ai_services] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.post("/api/ai/chat", json={"message": "halo", "conversation_history": []})
            assert response.status_code == 200
            assert response.json()["reply"] == "Halo!"
        finally:
            app.dependency_overrides.clear()

    def test_search_endpoint(self, app, client, mock_current_user):
        from app.api.ai import get_ai_services
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.search.return_value = SemanticSearchResponse(
            query="kopi",
            results=[
                SearchResultItem(
                    id="exp-1",
                    amount=10.0,
                    type="expense",
                    description="kopi",
                    category="food",
                    subcategory="beverage",
                    payment_method="cash",
                    transaction_date="2026-04-01",
                    similarity=0.9,
                )
            ],
            total=1,
        )
        app.dependency_overrides[get_ai_services] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/ai/search?q=kopi&threshold=0.5&limit=5")
            assert response.status_code == 200
            assert response.json()["total"] == 1
        finally:
            app.dependency_overrides.clear()
