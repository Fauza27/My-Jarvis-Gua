import pytest
from unittest.mock import MagicMock

from app.services.expense_service import ExpenseService
from app.models.expense import (
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseOut,
    ExpensesListOut,
)
from app.core.exceptions import ValidationError

pytestmark = pytest.mark.unit


def make_expense_dict(expense_id: str = "exp-1") -> dict:
    return {
        "id": expense_id,
        "amount": 50.0,
        "type": "expense",
        "description": "makan siang",
        "category": "food",
        "subcategory": "lunch",
        "payment_method": "cash",
        "transaction_date": "2026-04-01",
        "created_at": "2026-04-01T00:00:00+00:00",
        "updated_at": "2026-04-01T00:00:00+00:00",
    }


class TestGetAllExpenses:

    def test_get_all_expenses_returns_list(self, mock_expense_repo):
        mock_expense_repo.find_all.return_value = [make_expense_dict()]
        mock_expense_repo.count_all.return_value = 1
        service = ExpenseService(expense_repo=mock_expense_repo)

        result = service.get_all_expenses(user_id="user-1")

        assert isinstance(result, ExpensesListOut)
        assert result.total == 1
        assert len(result.expenses) == 1
        assert isinstance(result.expenses[0], ExpenseOut)

    def test_get_all_expenses_passes_filters(self, mock_expense_repo):
        mock_expense_repo.find_all.return_value = []
        mock_expense_repo.count_all.return_value = 0
        service = ExpenseService(expense_repo=mock_expense_repo)

        service.get_all_expenses(
            user_id="user-1",
            limit=10,
            offset=5,
            expense_type="expense",
            category="food",
            q="kopi",
            date_from="2026-04-01",
            date_to="2026-04-30",
            sort_by="amount",
            sort_order="asc",
        )

        mock_expense_repo.find_all.assert_called_once_with(
            "user-1",
            limit=10,
            offset=5,
            expense_type="expense",
            category="food",
            q="kopi",
            date_from="2026-04-01",
            date_to="2026-04-30",
            sort_by="amount",
            sort_order="asc",
        )
        mock_expense_repo.count_all.assert_called_once_with(
            "user-1",
            expense_type="expense",
            category="food",
            q="kopi",
            date_from="2026-04-01",
            date_to="2026-04-30",
        )


class TestCreateExpense:

    def test_create_expense_calls_repo_and_returns_model(
        self, mock_expense_repo, mock_embedding_service
    ):
        mock_expense_repo.create.return_value = make_expense_dict("exp-2")
        service = ExpenseService(
            expense_repo=mock_expense_repo,
            embedding_service=mock_embedding_service,
        )
        request = CreateExpenseRequest(
            amount=10.0,
            type="expense",
            description="kopi",
            category="food",
            subcategory="beverage",
            payment_method="cash",
            transaction_date="2026-04-01",
        )
        background_tasks = MagicMock()

        result = service.create_expense(
            user_id="user-1",
            request=request,
            background_tasks=background_tasks,
        )

        assert isinstance(result, ExpenseOut)
        mock_expense_repo.create.assert_called_once()
        background_tasks.add_task.assert_called_once()


class TestUpdateExpense:

    def test_update_expense_without_fields_raises_validation_error(
        self, mock_expense_repo
    ):
        service = ExpenseService(expense_repo=mock_expense_repo)
        request = UpdateExpenseRequest()

        with pytest.raises(ValidationError):
            service.update_expense(
                user_id="user-1",
                expense_id="exp-1",
                request=request,
                background_tasks=None,
            )

    def test_update_expense_triggers_embedding_when_fields_change(
        self, mock_expense_repo, mock_embedding_service
    ):
        mock_expense_repo.update.return_value = make_expense_dict("exp-3")
        service = ExpenseService(
            expense_repo=mock_expense_repo,
            embedding_service=mock_embedding_service,
        )
        request = UpdateExpenseRequest(description="baru")
        background_tasks = MagicMock()

        result = service.update_expense(
            user_id="user-1",
            expense_id="exp-3",
            request=request,
            background_tasks=background_tasks,
        )

        assert isinstance(result, ExpenseOut)
        background_tasks.add_task.assert_called_once()


class TestSummary:

    def test_summary_returns_defaults(self, mock_expense_repo):
        mock_expense_repo.get_summary_all_time.return_value = {}
        service = ExpenseService(expense_repo=mock_expense_repo)

        result = service.get_expense_summary_all_time(user_id="user-1")

        assert result.total_income == 0.0
        assert result.total_expense == 0.0
        assert result.net_balance == 0.0


class TestExportCsv:

    def test_export_expenses_csv_batches(self, mock_expense_repo):
        mock_expense_repo.find_all.side_effect = [
            [make_expense_dict("exp-1")],
            [],
        ]
        service = ExpenseService(expense_repo=mock_expense_repo)

        csv_text = service.export_expenses_csv(user_id="user-1")

        assert "id" in csv_text
        assert "amount" in csv_text
        assert "exp-1" in csv_text
