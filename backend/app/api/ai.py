from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.dependencies import CurrentUser, AccessToken
from app.infrastructure.openai_client import get_openai_client
from app.infrastructure.supabase_client import get_user_client, get_admin_supabase_client
from app.repositories.ai_repository import AIRepository
from app.repositories.expense_repository import ExpenseRepository
from app.services.expense_service import ExpenseService
from app.services.embedding_services import EmbeddingService
from app.services.ai_services import AIService
from app.models.ai import (
    ChatRequest, ChatResponse,
    SemanticSearchResponse,
)

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

def get_ai_services(
    token: AccessToken,
) -> AIService:
    openai = get_openai_client()

    user_client = get_user_client(token)
    expense_service = ExpenseService(expense_repo=ExpenseRepository(client=user_client))

    admin_client = get_admin_supabase_client()
    ai_repo = AIRepository(client=admin_client)
    embedding_service = EmbeddingService(openai_client=openai, ai_repo=ai_repo)

    return AIService(
        openai_client=openai,
        expense_service=expense_service,
        embedding_service=embedding_service,
        ai_repo=ai_repo
    )

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with the AI assistant, including tool function calls if needed.",
    description="Sends a message to the AI assistant along with the conversation history, and receives a response that may include tool function calls if needed."
)
async def chat(
    body: ChatRequest,
    current_user: CurrentUser,
    service: AIService = Depends(get_ai_services),
):
    return service.chat(
        user_id=str(current_user.id),
        message=body.message,
        conversation_history=body.conversation_history
    )

@router.get(
    "/search",
    response_model=SemanticSearchResponse,
    summary="Perform a semantic search for expenses based on a query.",
    description="Performs a semantic search for expenses based on the provided query string, returning the most relevant expenses according to their embedding similarity."
)
async def semantic_search(
    current_user: CurrentUser,
    q: str = Query(..., description="The search query string to find similar expenses."),
    threshold: float = Query(0.5, description="The similarity threshold for matching expenses (between 0 and 1)."),
    limit: int = Query(5, description="The maximum number of search results to return."),
    service: AIService = Depends(get_ai_services),
):
    return service.search(
        user_id=str(current_user.id),
        query=q,
        match_threshold=threshold,
        match_count=limit
    )