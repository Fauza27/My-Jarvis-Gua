from fastapi import APIRouter, Depends, status
from fastapi import Query   

from app.core.dependencies import CurrentUser, AccessToken
from app.infrastructure.supabase_client import get_user_client, get_admin_supabase_client
from app.infrastructure.openai_client import get_openai_client
from app.repositories.ai_repository import AIRepository
from app.repositories.expense_repository import ExpenseRepository
from app.services.expense_service import ExpenseService
from app.services.embedding_services import EmbeddingService
from app.models.expense import (
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseOut,
    ExpensesListOut,
    ExpenseSummaryResponse,
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def get_expense_service(token: AccessToken) -> ExpenseService:
    """Dependency to get an instance of ExpenseService."""
    user_client = get_user_client(access_token=token)
    admin_client = get_admin_supabase_client()
    openai_client = get_openai_client()

    ai_repo = AIRepository(client=admin_client)
    embedding_service = EmbeddingService(openai_client=openai_client, ai_repo=ai_repo)
    repo = ExpenseRepository(client=user_client)
    return ExpenseService(expense_repo=repo, embedding_service=embedding_service)

@router.get(
    "/summary",
    response_model=ExpenseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="All-time summary of my expenses",
)
async def get_expense_summary(
    current_user: CurrentUser,
    expense_service: ExpenseService = Depends(get_expense_service),
) -> ExpenseSummaryResponse:
    """Get all-time summary of total income, total expenses, and net balance."""
    return expense_service.get_expense_summary_all_time(user_id=current_user.id)


@router.get(
    "/summary/monthly",
    response_model=ExpenseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Monthly summary of my expenses",
)
async def get_expense_summary_by_month(
    current_user: CurrentUser,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    expense_service: ExpenseService = Depends(get_expense_service),
) -> ExpenseSummaryResponse:
    """Get summary of expenses for a specific month and year."""
    return expense_service.get_expense_summary_by_month(
        user_id=current_user.id,
        month=month,
        year=year,
    )


@router.get(
    "/summary/yearly",
    response_model=ExpenseSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Yearly summary of my expenses",
)
async def get_expense_summary_by_year(
    current_user: CurrentUser,
    year: int = Query(..., ge=2000, le=2100),
    expense_service: ExpenseService = Depends(get_expense_service),
) -> ExpenseSummaryResponse:
    """Get summary of expenses for a specific year."""
    return expense_service.get_expense_summary_by_year(
        user_id=current_user.id,
        year=year,
    )


@router.get(
    "",
    response_model=ExpensesListOut,
    status_code=status.HTTP_200_OK,
    summary="See all my expenses",
)
async def get_all_expenses(
    current_user: CurrentUser,
    expense_service: ExpenseService = Depends(get_expense_service),
    limit: int = 100,
    offset: int = 0,
    expense_type: str | None = Query(None, alias="type", pattern="^(income|expense)$"),
    category: str | None = Query(None),
    q: str | None = Query(None),
    date_from: str | None = Query(None, pattern="^\d{4}-\d{2}-\d{2}$"),
    date_to: str | None = Query(None, pattern="^\d{4}-\d{2}-\d{2}$"),
    sort_by: str = Query("created_at", pattern="^(created_at|transaction_date|amount)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
) -> ExpensesListOut:
    """Get all active expenses for the current user with pagination."""
    return expense_service.get_all_expenses(
        user_id=current_user.id,
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


@router.get(
    "/{expense_id}",
    response_model=ExpenseOut,
    status_code=status.HTTP_200_OK,
    summary="See details of an expense",
)
async def get_expense_by_id(
    expense_id: str,
    current_user: CurrentUser,
    expense_service: ExpenseService = Depends(get_expense_service),
) -> ExpenseOut:
    """Get a single active expense by its ID."""
    return expense_service.get_expense_by_id(
        user_id=current_user.id,
        expense_id=expense_id,
    )


@router.post(
    "",
    response_model=ExpenseOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense",
)
async def create_expense(
    request: CreateExpenseRequest,
    current_user: CurrentUser,
    expense_service: ExpenseService = Depends(get_expense_service),
) -> ExpenseOut:
    """Create a new expense."""
    return expense_service.create_expense(
        user_id=current_user.id,
        request=request,
    )


@router.patch(                             
    "/{expense_id}",
    response_model=ExpenseOut,
    status_code=status.HTTP_200_OK,
    summary="Update an existing expense",
)
async def update_expense(
    expense_id: str,
    request: UpdateExpenseRequest,
    current_user: CurrentUser,
    expense_service: ExpenseService = Depends(get_expense_service),
) -> ExpenseOut:
    """Partially update an existing expense."""
    return expense_service.update_expense(
        user_id=current_user.id,
        expense_id=expense_id,
        request=request,
    )


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT, 
    summary="Delete an expense",
)
async def delete_expense(
    expense_id: str,
    current_user: CurrentUser,
    expense_service: ExpenseService = Depends(get_expense_service),
) -> None:
    """Soft-delete an expense."""
    expense_service.delete_expense(
        user_id=current_user.id,
        expense_id=expense_id,
    )