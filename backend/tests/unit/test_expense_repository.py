import pytest
from unittest.mock import MagicMock

from app.repositories.expense_repository import ExpenseRepository
from app.core.exceptions import NotFoundError

pytestmark = pytest.mark.unit


def make_query_mock(response: MagicMock) -> MagicMock:
    query = MagicMock()
    query.select.return_value = query
    query.insert.return_value = query
    query.update.return_value = query
    query.eq.return_value = query
    query.ilike.return_value = query
    query.or_.return_value = query
    query.gte.return_value = query
    query.lte.return_value = query
    query.order.return_value = query
    query.limit.return_value = query
    query.offset.return_value = query
    query.is_.return_value = query
    query.maybe_single.return_value = query
    query.execute.return_value = response
    return query


class TestFindById:

    def test_find_by_id_raises_not_found(self):
        response = MagicMock()
        response.data = None
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ExpenseRepository(client=client)

        with pytest.raises(NotFoundError):
            repo.find_by_id(expense_id="exp-1", user_id="user-1")


class TestCreate:

    def test_create_raises_runtime_error_when_no_data(self):
        response = MagicMock()
        response.data = []
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ExpenseRepository(client=client)

        with pytest.raises(RuntimeError):
            repo.create(expense_data={"amount": 10})


class TestUpdate:

    def test_update_raises_not_found_when_no_data(self):
        response = MagicMock()
        response.data = []
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ExpenseRepository(client=client)

        with pytest.raises(NotFoundError):
            repo.update(expense_id="exp-1", user_id="user-1", update_data={"amount": 20})


class TestDelete:

    def test_delete_updates_deleted_at(self):
        response = MagicMock()
        response.data = [{"id": "exp-1"}]
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ExpenseRepository(client=client)
        repo.find_by_id = MagicMock(return_value={"id": "exp-1"})

        repo.delete(expense_id="exp-1", user_id="user-1")

        assert repo.find_by_id.called
        query.update.assert_called_once()


class TestSummary:

    def test_get_summary_all_time_rpc_success(self):
        client = MagicMock()
        repo = ExpenseRepository(client=client)
        repo._summary_via_rpc = MagicMock(return_value={
            "total_income": 100.0,
            "total_expense": 50.0,
            "net_balance": 50.0,
        })

        result = repo.get_summary_all_time(user_id="user-1")

        assert result["net_balance"] == 50.0

    def test_get_summary_all_time_fallback(self):
        response = MagicMock()
        response.data = [
            {"amount": 100, "type": "income"},
            {"amount": 40, "type": "expense"},
        ]
        query = make_query_mock(response)

        client = MagicMock()
        client.table.return_value = query

        repo = ExpenseRepository(client=client)
        repo._summary_via_rpc = MagicMock(return_value=None)

        result = repo.get_summary_all_time(user_id="user-1")

        assert result["total_income"] == 100.0
        assert result["total_expense"] == 40.0
        assert result["net_balance"] == 60.0
