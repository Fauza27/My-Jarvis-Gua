# CREATE TABLE IF NOT EXISTS expenses (
#     id               UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
#     user_id          UUID           REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
#     amount           NUMERIC(15, 2) NOT NULL,
#     type             VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
#     description      TEXT,
#     category         VARCHAR(50)    NOT NULL,
#     subcategory      VARCHAR(50),
#     payment_method   VARCHAR(50),
#     transaction_date DATE           DEFAULT CURRENT_DATE,
#     created_at       TIMESTAMPTZ    DEFAULT NOW() NOT NULL,
#     updated_at       TIMESTAMPTZ    DEFAULT NOW() NOT NULL,
#     deleted_at       TIMESTAMPTZ    DEFAULT NULL
# );

from calendar import monthrange
import logging
from supabase import Client
from postgrest.exceptions import APIError

from app.core.exceptions import NotFoundError


class ExpenseRepository:
    """
    Managing all data access for table 'expenses'.
    Write operations use TABLE directly.
    Read operations use VIEW (active_expenses) to automatically filter soft-deleted records.
    """

    TABLE = "expenses"
    VIEW = "active_expenses"  # filters deleted_at IS NULL

    def __init__(self, client: Client):
        self._client = client
        self._logger = logging.getLogger(__name__)

    def _summary_via_rpc(self, function_name: str, params: dict) -> dict | None:
        try:
            response = self._client.rpc(function_name, params).execute()
        except Exception as exc:
            self._logger.warning("Summary RPC failed (%s): %s", function_name, str(exc)[:100])
            return None

        if not response.data:
            return None

        row = response.data[0]
        return {
            "total_income": float(row.get("total_income") or 0),
            "total_expense": float(row.get("total_expense") or 0),
            "net_balance": float(row.get("net_balance") or 0),
        }

    def _apply_list_filters(
        self,
        query,
        user_id: str,
        expense_type: str | None = None,
        category: str | None = None,
        q: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ):
        """Apply common filters for expense list and count queries."""
        query = query.eq("user_id", user_id)

        if expense_type:
            query = query.eq("type", expense_type)

        if category:
            query = query.ilike("category", f"%{category.strip().lower()}%")

        if q:
            keyword = q.strip().lower().replace(",", " ")
            if keyword:
                query = query.or_(
                    f"description.ilike.%{keyword}%,category.ilike.%{keyword}%,subcategory.ilike.%{keyword}%"
                )

        if date_from:
            query = query.gte("transaction_date", date_from)

        if date_to:
            query = query.lte("transaction_date", date_to)

        return query

    # =========================================================================
    # READ
    # =========================================================================

    def find_all(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
        expense_type: str | None = None,
        category: str | None = None,
        q: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> list[dict]:
        """
        Find all active expenses for a user with pagination.

        Args:
            user_id: The authenticated user's ID.
            limit:   Maximum number of records to return (default 100).
            offset:  Number of records to skip (default 0).

        Returns:
            List of expense dicts ordered by created_at descending.
        """
        query = self._client.table(self.VIEW).select("*")
        query = self._apply_list_filters(
            query,
            user_id=user_id,
            expense_type=expense_type,
            category=category,
            q=q,
            date_from=date_from,
            date_to=date_to,
        )

        allowed_sort_columns = {
            "created_at": "created_at",
            "transaction_date": "transaction_date",
            "amount": "amount",
        }
        order_column = allowed_sort_columns.get(sort_by, "created_at")
        is_desc = sort_order != "asc"

        response = query.order(order_column, desc=is_desc).limit(limit).offset(offset).execute()
        return response.data

    def count_all(
        self,
        user_id: str,
        expense_type: str | None = None,
        category: str | None = None,
        q: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> int:
        """
        Count all active expenses for a user.

        Args:
            user_id: The authenticated user's ID.

        Returns:
            Total number of active expense records for the user.
        """
        query = self._client.table(self.VIEW).select("id", count="exact", head=True)
        query = self._apply_list_filters(
            query,
            user_id=user_id,
            expense_type=expense_type,
            category=category,
            q=q,
            date_from=date_from,
            date_to=date_to,
        )
        response = query.execute()
        return int(response.count or 0)

    def find_by_id(self, expense_id: str, user_id: str) -> dict:
        """
        Find a single active expense by its ID and owner.

        Args:
            expense_id: UUID of the expense.
            user_id:    The authenticated user's ID.

        Returns:
            Expense dict.

        Raises:
            NotFoundError: If the expense does not exist or belongs to another user.
        """
        try:
            response = (
                self._client
                .table(self.VIEW)  # soft-delete filtered
                .select("*")
                .eq("id", expense_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            if response is None or not getattr(response, "data", None):
                raise NotFoundError(f"Expense with id '{expense_id}' not found")
            return response.data
        except NotFoundError:
            raise
        except APIError as e:
            # Only catch DB/network errors — not swallow everything
            raise NotFoundError(f"Expense with id '{expense_id}' not found") from e

    # =========================================================================
    # WRITE
    # =========================================================================

    def create(self, expense_data: dict) -> dict:
        """
        Insert a new expense record.

        Args:
            expense_data: Dict of column values to insert.

        Returns:
            The created expense dict returned by the DB.

        Raises:
            RuntimeError: If the DB returns no data after insert.
        """
        response = (
            self._client
            .table(self.TABLE)
            .insert(expense_data)
            .execute()
        )
        if not response.data:
            raise RuntimeError("Failed to create expense")
        return response.data[0]

    def update(self, expense_id: str, user_id: str, update_data: dict) -> dict:
        """
        Update an expense by its ID and owner.

        Args:
            expense_id:  UUID of the expense.
            user_id:     The authenticated user's ID.
            update_data: Dict of fields to update.

        Returns:
            The updated expense dict returned by the DB.

        Raises:
            NotFoundError: If no matching record was updated.
        """
        response = (
            self._client
            .table(self.TABLE)
            .update(update_data)
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        if not response.data:
            raise NotFoundError(f"Expense with id '{expense_id}' not found")
        return response.data[0]

    def delete(self, expense_id: str, user_id: str) -> None:
        """
        Soft-delete an expense by its ID and owner.

        Calls the DB function soft_delete_expense which sets deleted_at = NOW().
        Existence is verified AFTER the RPC call to avoid a race condition.

        Args:
            expense_id: UUID of the expense.
            user_id:    The authenticated user's ID.

        Raises:
            NotFoundError: If the expense does not exist or is already deleted.
        """
        # Verify existence first — raises NotFoundError if not found
        self.find_by_id(expense_id, user_id)

        from datetime import datetime, timezone
        now_str = datetime.now(timezone.utc).isoformat()

        response = (
            self._client
            .table(self.TABLE)
            .update({"deleted_at": now_str})
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not response.data:
            raise RuntimeError(f"Soft delete failed for expense '{expense_id}'")

    # =========================================================================
    # SUMMARY
    # =========================================================================
    def get_summary_all_time(self, user_id: str) -> dict:
        """Get all-time income/expense summary for a user."""
        rpc_result = self._summary_via_rpc(
            "expense_summary_all_time",
            {"user_id_param": user_id},
        )
        if rpc_result is not None:
            return rpc_result

        response = (
            self._client
            .table(self.VIEW)
            .select("amount, type")
            .eq("user_id", user_id)
            .execute()
        )
        income  = float(sum(e["amount"] for e in response.data if e["type"] == "income"))
        expense = float(sum(e["amount"] for e in response.data if e["type"] == "expense"))
        return {
            "total_income":  income,
            "total_expense": expense,
            "net_balance":   income - expense,
        }

    def get_summary_by_date(self, user_id: str, transaction_date: str) -> dict:
        """
        Get income/expense summary for a user on a specific date.

        Args:
            user_id:          The authenticated user's ID.
            transaction_date: Date string in YYYY-MM-DD format.

        Returns:
            Dict with keys: total_income, total_expense, net_balance.
        """
        response = (
            self._client
            .table(self.VIEW)
            .select("amount, type")
            .eq("user_id", user_id)
            .eq("transaction_date", transaction_date)
            .execute()
        )
        # Cast to float — DB returns NUMERIC as Decimal which breaks JSON serialization
        income  = float(sum(e["amount"] for e in response.data if e["type"] == "income"))
        expense = float(sum(e["amount"] for e in response.data if e["type"] == "expense"))
        return {
            "total_income":  income,
            "total_expense": expense,
            "net_balance":   income - expense,
        }

    def get_summary_by_month(self, user_id: str, month: int, year: int) -> dict:
        """
        Get income/expense summary for a user in a specific month and year.

        Args:
            user_id: The authenticated user's ID.
            month:   Month as integer (1–12).
            year:    Year as integer (e.g. 2024).

        Returns:
            Dict with keys: total_income, total_expense, net_balance.
        """
        rpc_result = self._summary_via_rpc(
            "expense_summary_by_month",
            {
                "user_id_param": user_id,
                "month_param": month,
                "year_param": year,
            },
        )
        if rpc_result is not None:
            return rpc_result

        last_day   = monthrange(year, month)[1]
        start_date = f"{year}-{month:02d}-01"
        end_date   = f"{year}-{month:02d}-{last_day}"

        response = (
            self._client
            .table(self.VIEW)
            .select("amount, type")
            .eq("user_id", user_id)
            .gte("transaction_date", start_date)
            .lte("transaction_date", end_date)
            .execute()
        )
        # Cast to float — DB returns NUMERIC as Decimal which breaks JSON serialization
        income  = float(sum(e["amount"] for e in response.data if e["type"] == "income"))
        expense = float(sum(e["amount"] for e in response.data if e["type"] == "expense"))
        return {
            "total_income":  income,
            "total_expense": expense,
            "net_balance":   income - expense,
        }

    def get_summary_by_year(self, user_id: str, year: int) -> dict:
        """
        Get income/expense summary for a user in a specific year.

        Args:
            user_id: The authenticated user's ID.
            year:    Year as integer (e.g. 2024).

        Returns:
            Dict with keys: total_income, total_expense, net_balance.
        """
        rpc_result = self._summary_via_rpc(
            "expense_summary_by_year",
            {
                "user_id_param": user_id,
                "year_param": year,
            },
        )
        if rpc_result is not None:
            return rpc_result

        start_date = f"{year}-01-01"
        end_date   = f"{year}-12-31"

        response = (
            self._client
            .table(self.VIEW)
            .select("amount, type")
            .eq("user_id", user_id)
            .gte("transaction_date", start_date)
            .lte("transaction_date", end_date)
            .execute()
        )
        # Cast to float — DB returns NUMERIC as Decimal which breaks JSON serialization
        income  = float(sum(e["amount"] for e in response.data if e["type"] == "income"))
        expense = float(sum(e["amount"] for e in response.data if e["type"] == "expense"))
        return {
            "total_income":  income,
            "total_expense": expense,
            "net_balance":   income - expense,
        }