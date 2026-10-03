from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.models.timezone import TimeZone

class ConversationMessage(BaseModel):
    """Represents a single message in a conversation, either from the user or the assistant."""
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)

# /ai/chat
class ChatRequest(BaseModel):
    """Represents a request to the chat endpoint, containing the conversation history."""
    message: str = Field(min_length=1, max_length=8000)
    timezone: TimeZone = "UTC"
    conversation_history: list[ConversationMessage] = Field(default_factory=list, max_length=20)

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "siapa presiden yang suka sawit",
                "conversation_history": []
            }
        }
    }

class ChatResponse(BaseModel):
    """Represents the response from the chat endpoint, containing the assistant's reply."""
    reply: str
    conversation_history: list[ConversationMessage]
    action_taken: list[str] = []

# /ai/search

class SearchResultItem(BaseModel):
    """Represents a single search result item."""
    id: str
    amount: float
    type: Literal["income", "expense"]
    description: Optional[str]
    category: str
    subcategory: Optional[str]
    payment_method: Optional[str]
    transaction_date: Optional[str]
    similarity: float

class SemanticSearchResponse(BaseModel):
    """Represents the response from the semantic search endpoint, containing a list of search results."""
    query: str
    results: list[SearchResultItem]
    total: int
