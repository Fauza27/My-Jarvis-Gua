import logging
from openai import OpenAI
from app.core.config import get_settings
from app.repositories.ai_repository import AIRepository

logger = logging.getLogger(__name__)

class EmbeddingService:
    """ Service for handling embedding generation and semantic search operations. """

    def __init__(self, openai_client: OpenAI, ai_repo: AIRepository):
        self.openai_client = openai_client
        self._repo = ai_repo
        self.settings = get_settings()

    def generate_for_query(self, text: str) -> list[float]:
        """ generates an embedding vector for the given text using OpenAI's embedding model. """
        response = self.openai_client.embeddings.create(
            model=self.settings.OPENAI_EMBEDDING_MODEL,
            input=text
        )
        return response.data[0].embedding
    
    def generate_for_expense(
        self,
        expense_id: str,
        amount: float,
        type: str,
        description: str = None,
        category: str = None,
        subcategory: str = None,
        payment_method: str = None,
    ) -> None:
        """ generates an embedding for the expense and saves it to the database. """
        text_to_embed = f"{type} {amount}"
        if category:
            text_to_embed += f" {category}"
        if description:
            text_to_embed += f" {description}"
        if subcategory:
            text_to_embed += f" {subcategory}"
        if payment_method:
            text_to_embed += f" {payment_method}"
        embedding = self.generate_for_query(text_to_embed)
        self._repo.save_embedding(expense_id=expense_id, embedding=embedding)
    
    def generate_for_expenses_safe(
        self,
        expense_id: str,
        amount: float,
        type: str,
        description: str = None,
        category: str = None,
        subcategory: str = None,
        payment_method: str = None,
    ) -> bool:
        """
        safe version of generate_for_expense that not raise exception.
        used when embedding is optional, so if embedding generation fail, it will not block the main flow.
        """
        try:
            self.generate_for_expense(
                expense_id=expense_id,
                amount=amount,
                type=type,
                description=description,
                category=category,
                subcategory=subcategory,
                payment_method=payment_method,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to generate embedding for expense {expense_id}: {str(e)}")
            return False