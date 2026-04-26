import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.core.application import create_app
from app.models.expense import (
    ExpenseOut,
    ExpensesListOut,
    ExpenseSummaryResponse,
)

pytestmark = pytest.mark.api


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    with TestClient(app) as c:
        yield c


def make_expense_out(expense_id: str = "exp-123") -> ExpenseOut:
    return ExpenseOut(
        id=expense_id,
        amount=100.5,
        type="expense",
        description="makan siang",
        category="food",
        subcategory="lunch",
        payment_method="card",
        transaction_date="2026-04-01",
        created_at="2026-04-01T00:00:00+00:00",
        updated_at="2026-04-01T00:00:00+00:00",
    )


@pytest.fixture
def mock_current_user():
    user = MagicMock()
    user.id = "user-uuid-123"
    return user


# =============================================================================
# GET /api/expenses
# =============================================================================

class TestExpenseListEndpoint:

    def test_get_all_expenses_returns_list(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.get_all_expenses.return_value = ExpensesListOut(
            expenses=[make_expense_out()],
            total=1,
        )
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/expenses")
            assert response.status_code == 200

            body = response.json()
            assert "expenses" in body
            assert body["total"] == 1
            assert len(body["expenses"]) == 1
        finally:
            app.dependency_overrides.clear()

    def test_get_all_expenses_invalid_type_returns_422(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        try:
            response = client.get("/api/expenses?type=invalid")
            assert response.status_code == 422
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# GET /api/expenses/{id}
# =============================================================================

class TestExpenseDetailEndpoint:

    def test_get_expense_by_id_returns_item(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.get_expense_by_id.return_value = make_expense_out("exp-999")
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/expenses/exp-999")
            assert response.status_code == 200
            assert response.json()["id"] == "exp-999"
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# POST /api/expenses
# =============================================================================

class TestCreateExpenseEndpoint:

    def test_create_expense_returns_201(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.create_expense.return_value = make_expense_out("exp-201")
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            payload = {
                "amount": 25.5,
                "type": "expense",
                "description": "kopi",
                "category": "food",
                "subcategory": "beverage",
                "payment_method": "cash",
                "transaction_date": "2026-04-01",
            }
            response = client.post("/api/expenses", json=payload)
            assert response.status_code == 201
            assert response.json()["id"] == "exp-201"
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# PATCH /api/expenses/{id}
# =============================================================================

class TestUpdateExpenseEndpoint:

    def test_update_expense_returns_200(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.update_expense.return_value = make_expense_out("exp-333")
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            payload = {
                "description": "makan malam",
                "amount": 120.0,
            }
            response = client.patch("/api/expenses/exp-333", json=payload)
            assert response.status_code == 200
            assert response.json()["id"] == "exp-333"
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# DELETE /api/expenses/{id}
# =============================================================================

class TestDeleteExpenseEndpoint:

    def test_delete_expense_returns_204(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.delete_expense.return_value = None
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.delete("/api/expenses/exp-444")
            assert response.status_code == 204
            assert response.text == ""
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# SUMMARY endpoints
# =============================================================================

class TestExpenseSummaryEndpoints:

    def test_get_expense_summary_all_time(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.get_expense_summary_all_time.return_value = ExpenseSummaryResponse(
            total_income=1000.0,
            total_expense=400.0,
            net_balance=600.0,
        )
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/expenses/summary")
            assert response.status_code == 200
            body = response.json()
            assert body["net_balance"] == 600.0
        finally:
            app.dependency_overrides.clear()

    def test_get_expense_summary_by_month(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.get_expense_summary_by_month.return_value = ExpenseSummaryResponse(
            total_income=500.0,
            total_expense=200.0,
            net_balance=300.0,
        )
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/expenses/summary/monthly?month=4&year=2026")
            assert response.status_code == 200
            assert response.json()["total_expense"] == 200.0
        finally:
            app.dependency_overrides.clear()

    def test_get_expense_summary_by_year(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.get_expense_summary_by_year.return_value = ExpenseSummaryResponse(
            total_income=3000.0,
            total_expense=1200.0,
            net_balance=1800.0,
        )
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/expenses/summary/yearly?year=2026")
            assert response.status_code == 200
            assert response.json()["total_income"] == 3000.0
        finally:
            app.dependency_overrides.clear()


# =============================================================================
# GET /api/expenses/export/csv
# =============================================================================

class TestExpenseExportEndpoint:

    def test_export_expenses_csv(self, app, client, mock_current_user):
        from app.api.expense import get_expense_service
        from app.core.dependencies import get_current_user

        mock_service = MagicMock()
        mock_service.export_expenses_csv.return_value = "id,amount\n1,10"
        app.dependency_overrides[get_expense_service] = lambda: mock_service
        app.dependency_overrides[get_current_user] = lambda: mock_current_user

        try:
            response = client.get("/api/expenses/export/csv")
            assert response.status_code == 200
            assert "text/csv" in response.headers.get("content-type", "")
            assert "attachment; filename=\"expenses_export.csv\"" in response.headers.get(
                "content-disposition", ""
            )
        finally:
            app.dependency_overrides.clear()
