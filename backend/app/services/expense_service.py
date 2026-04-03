from app.core.exceptions import ValidationError
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

    def get_expense_by_id(self, user_id: str, expense_id: str) -> ExpenseOut:
        """Get a single active expense by its ID."""
        expense_data = self._expense_repo.find_by_id(expense_id, user_id)
        return ExpenseOut.from_db(expense_data)

    def create_expense(self, user_id: str, request: CreateExpenseRequest) -> ExpenseOut:
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

        created_expense = self._expense_repo.create(expense_data)

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
    ) -> ExpenseOut:
        """Partially update an existing expense."""
        update_payload = request.to_update_dict()

        if not update_payload:
            raise ValidationError("No field to update. Send at least one field.")

        updated_expense = self._expense_repo.update(expense_id, user_id, update_payload)
        
        if request.amount or request.type or request.description or request.category or request.subcategory or request.payment_method:
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