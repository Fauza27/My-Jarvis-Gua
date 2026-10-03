from app.core.exceptions import ValidationError, ConflictError, NotFoundError
from postgrest.exceptions import APIError
from fastapi import BackgroundTasks
import csv
import io
from datetime import date
from decimal import Decimal
from app.models.expense import (
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseOut,
    ExpensesListOut,
    ExpenseSummaryResponse,
)
from app.repositories.expense_repository import ExpenseRepository


class ExpenseService:
    """Manage all use cases related to expenses."""

    def __init__(self, expense_repo: ExpenseRepository, embedding_service=None,):
        self._expense_repo = expense_repo
        self._embedding_service = embedding_service

    def get_all_expenses(
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
    ) -> ExpensesListOut:
        """Get all active expenses for a user with pagination."""
        self.validate_date_range(date_from, date_to)
        expenses_data = self._expense_repo.find_all(
            user_id,
            limit=limit,
            offset=offset,
            expense_type=expense_type,
            category=category,
            q=q,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        total = self._expense_repo.count_all(
            user_id,
            expense_type=expense_type,
            category=category,
            q=q,
            date_from=date_from,
            date_to=date_to,
        )
        expenses = [ExpenseOut.from_db(data) for data in expenses_data]
        return ExpensesListOut(expenses=expenses, total=total)

    @staticmethod
    def validate_date_range(date_from: str | None, date_to: str | None) -> None:
        try:
            start = date.fromisoformat(date_from) if date_from else None
            end = date.fromisoformat(date_to) if date_to else None
        except ValueError:
            raise ValidationError("Date must be a valid calendar date in YYYY-MM-DD format")
        if start and end and start > end:
            raise ValidationError("date_from must not be after date_to")

    def get_expense_by_id(self, user_id: str, expense_id: str) -> ExpenseOut:
        """Get a single active expense by its ID."""
        expense_data = self._expense_repo.find_by_id(expense_id, user_id)
        return ExpenseOut.from_db(expense_data)

    def create_expense(
        self,
        user_id: str,
        request: CreateExpenseRequest,
        background_tasks: BackgroundTasks | None = None,
        idempotency_key: str | None = None,
    ) -> ExpenseOut:
        """Create a new expense."""
        expense_data = {
            "user_id":          user_id,
            "amount":           request.amount,
            "type":             request.type,
            "description":      request.description,
            "category":         request.category,
            "subcategory":      request.subcategory,
            "payment_method":   request.payment_method,
        }

        if request.transaction_date is not None:
            expense_data["transaction_date"] = request.transaction_date

        if idempotency_key:
            expense_data["id"] = idempotency_key
        try:
            created_expense = self._expense_repo.create(expense_data)
        except APIError as exc:
            if not idempotency_key or exc.code != "23505":
                raise
            try:
                existing = self._expense_repo.find_by_id(idempotency_key, user_id)
            except NotFoundError:
                raise ConflictError("This operation key has already been used")
            for key, value in expense_data.items():
                actual = existing.get(key)
                matches = Decimal(str(actual)) == Decimal(str(value)) if key == "amount" else str(actual) == str(value)
                if not matches:
                    raise ConflictError("Operation key cannot be reused with different transaction data")
            return ExpenseOut.from_db(existing)

        if self._embedding_service is not None:
            if background_tasks is not None:
                background_tasks.add_task(
                    self._embedding_service.generate_for_expenses_safe,
                    expense_id=created_expense["id"],
                    amount=created_expense["amount"],
                    type=created_expense["type"],
                    description=created_expense["description"],
                    category=created_expense["category"],
                    subcategory=created_expense["subcategory"],
                    payment_method=created_expense["payment_method"],
                )
            else:
                self._embed_task_if_available(
                    expense_id=created_expense["id"],
                    amount=created_expense["amount"],
                    type=created_expense["type"],
                    description=created_expense["description"],
                    category=created_expense["category"],
                    subcategory=created_expense["subcategory"],
                    payment_method=created_expense["payment_method"],
                )
        return ExpenseOut.from_db(created_expense)

    def update_expense(
        self,
        user_id: str,
        expense_id: str,
        request: UpdateExpenseRequest,
        background_tasks: BackgroundTasks | None = None,
    ) -> ExpenseOut:
        """Partially update an existing expense."""
        update_payload = request.to_update_dict()

        if not update_payload:
            raise ValidationError("No field to update. Send at least one field.")

        updated_expense = self._expense_repo.update(expense_id, user_id, update_payload)

        embedded_fields = {"amount", "type", "description", "category", "subcategory", "payment_method"}
        if any(field in update_payload for field in embedded_fields):
            if self._embedding_service is not None:
                if background_tasks is not None:
                    background_tasks.add_task(
                        self._embedding_service.generate_for_expenses_safe,
                        expense_id=expense_id,
                        amount=updated_expense["amount"],
                        type=updated_expense["type"],
                        description=updated_expense["description"],
                        category=updated_expense["category"],
                        subcategory=updated_expense["subcategory"],
                        payment_method=updated_expense["payment_method"],
                    )
                else:
                    self._embed_task_if_available(
                        expense_id=expense_id,
                        amount=updated_expense["amount"],
                        type=updated_expense["type"],
                        description=updated_expense["description"],
                        category=updated_expense["category"],
                        subcategory=updated_expense["subcategory"],
                        payment_method=updated_expense["payment_method"],
                    )
        return ExpenseOut.from_db(updated_expense)

    def delete_expense(self, user_id: str, expense_id: str) -> None:
        """Soft-delete an expense."""
        self._expense_repo.delete(expense_id, user_id)

    # =========================================================================
    # SUMMARY — 3 method terpisah sesuai yang dipanggil router
    # =========================================================================

    def get_expense_summary_all_time(self, user_id: str) -> ExpenseSummaryResponse:
        """Get all-time income/expense summary for a user."""
        summary_data = self._expense_repo.get_summary_all_time(user_id)
        return ExpenseSummaryResponse(
            total_income=summary_data.get("total_income", 0.0),
            total_expense=summary_data.get("total_expense", 0.0),
            net_balance=summary_data.get("net_balance", 0.0),
        )

    def get_expense_summary_by_month(
        self,
        user_id: str,
        month: int,
        year: int,
    ) -> ExpenseSummaryResponse:
        """Get income/expense summary for a specific month and year."""
        summary_data = self._expense_repo.get_summary_by_month(user_id, month, year)
        return ExpenseSummaryResponse(
            total_income=summary_data.get("total_income", 0.0),
            total_expense=summary_data.get("total_expense", 0.0),
            net_balance=summary_data.get("net_balance", 0.0),
        )

    def get_expense_summary_by_year(
        self,
        user_id: str,
        year: int,
    ) -> ExpenseSummaryResponse:
        """Get income/expense summary for a specific year."""
        summary_data = self._expense_repo.get_summary_by_year(user_id, year)
        return ExpenseSummaryResponse(
            total_income=summary_data.get("total_income", 0.0),
            total_expense=summary_data.get("total_expense", 0.0),
            net_balance=summary_data.get("net_balance", 0.0),
        )

    def _embed_task_if_available(
        self,
        expense_id: str,
        amount: float,
        type: str,
        description: str = None,
        category: str = None,
        subcategory: str = None,
        payment_method: str = None
    ) -> None:
        """Helper method to trigger embedding generation if the embedding service is available."""
        if self._embedding_service is None:
            return
        self._embedding_service.generate_for_expenses_safe(
            expense_id=expense_id,
            amount=amount,
            type=type,
            description=description,
            category=category,
            subcategory=subcategory,
            payment_method=payment_method,
        )

    def export_expenses_csv(
        self,
        user_id: str,
        expense_type: str | None = None,
        category: str | None = None,
        q: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> str:
        """Export active expenses for a user as CSV text."""
        return ''.join(self.iter_expenses_csv(user_id, expense_type, category, q, date_from, date_to, sort_by, sort_order))

    def iter_expenses_csv(self, user_id: str, expense_type=None, category=None, q=None,
                          date_from=None, date_to=None, sort_by="created_at", sort_order="desc"):
        """Stream one page at a time; do not retain the full export in memory."""
        self.validate_date_range(date_from, date_to)
        columns = ["id", "amount", "type", "category", "subcategory", "payment_method",
                   "description", "transaction_date", "created_at", "updated_at"]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        offset = 0
        page_size = 500
        while True:
            batch = self._expense_repo.find_all(
                user_id=user_id, limit=page_size, offset=offset, expense_type=expense_type,
                category=category, q=q, date_from=date_from, date_to=date_to,
                sort_by=sort_by, sort_order=sort_order,
            )
            for item in batch:
                writer.writerow([self._csv_safe_cell(item.get(column, "")) for column in columns])
            if batch:
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)
            if len(batch) < page_size:
                break
            offset += len(batch)

    @staticmethod
    def _csv_safe_cell(value):
        if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@', '\t', '\r', '\n')):
            return "'" + value
        return value
