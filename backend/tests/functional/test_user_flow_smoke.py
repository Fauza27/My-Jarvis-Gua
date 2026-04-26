import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.auth import TokenOut, UserOut, MessageOut
from app.models.expense import ExpenseOut

pytestmark = pytest.mark.functional


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


def make_expense_out(expense_id: str) -> ExpenseOut:
    return ExpenseOut(
        id=expense_id,
        amount=100.0,
        type="expense",
        description="kopi",
        category="food",
        subcategory="beverage",
        payment_method="cash",
        transaction_date="2026-04-01",
        created_at="2026-04-01T00:00:00+00:00",
        updated_at="2026-04-01T00:00:00+00:00",
    )


class TestUserFlowSmoke:

    def test_login_then_crud_expense(self, app, client):
        from app.api.auth import get_auth_service
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_auth = MagicMock()
        mock_auth.login.return_value = make_token_out()
        mock_auth.logout.return_value = MessageOut(message="ok")

        mock_expense = MagicMock()
        mock_expense.create_expense.return_value = make_expense_out("exp-1")
        mock_expense.get_expense_by_id.return_value = make_expense_out("exp-1")
        mock_expense.update_expense.return_value = make_expense_out("exp-1")
        mock_expense.delete_expense.return_value = None

        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.email = "user@test.com"

        app.dependency_overrides[get_auth_service] = lambda: mock_auth
        app.dependency_overrides[get_expense_service] = lambda: mock_expense
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            login = client.post("/api/auth/login", json={
                "email": "user@test.com",
                "password": "Password123!",
            })
            assert login.status_code == 200

            created = client.post("/api/expenses", json={
                "amount": 100,
                "type": "expense",
                "description": "kopi",
                "category": "food",
            })
            assert created.status_code == 201

            detail = client.get("/api/expenses/exp-1")
            assert detail.status_code == 200

            updated = client.patch("/api/expenses/exp-1", json={"description": "kopi susu"})
            assert updated.status_code == 200

            deleted = client.delete("/api/expenses/exp-1")
            assert deleted.status_code == 204
        finally:
            app.dependency_overrides.clear()
