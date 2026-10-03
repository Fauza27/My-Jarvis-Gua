from supabase import Client

class AIRepository:
    """Repository for AI-related database operations using Supabase."""

    EXPENSE_TABLE = "expenses"

    def __init__(self, client: Client):
        self.client = client
    
    def load_embedding_source(self, expense_id: str) -> dict | None:
        response = self.client.table(self.EXPENSE_TABLE).select(
            "id,amount,type,description,category,subcategory,payment_method,updated_at"
        ).eq("id", expense_id).is_("deleted_at", "null").execute()
        return response.data[0] if response.data else None

    def save_embedding(self, expense_id: str, embedding: list[float], source_updated_at: str, model: str) -> bool:
        """Reject stale embedding results if the transaction changed during generation."""
        response = self.client.table(self.EXPENSE_TABLE).update({
            "embedding": embedding, "embedding_pending": False, "embedding_model": model,
        }).eq("id", expense_id).eq("updated_at", source_updated_at).is_("deleted_at", "null").execute()
        return bool(response.data)

    def pending_embeddings(self, limit: int = 20) -> list[dict]:
        response = self.client.table(self.EXPENSE_TABLE).select("id").is_(
            "deleted_at", "null"
        ).or_("embedding.is.null,embedding_pending.eq.true").order("updated_at").limit(limit).execute()
        return response.data or []
    
    def semantic_search(
        self,
        query_embedding: list[float],
        user_id: str,
        match_threshold: float = 0.5,
        match_count: int = 5,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict]:
        """ finds the most similar expenses based on cosine similarity of embeddings."""
        parameters = {
                "query_embedding": query_embedding,
                "user_id_param": user_id,
                "match_threshold": match_threshold,
                "match_count": match_count,
            }
        if date_from or date_to:
            parameters.update(date_from=date_from, date_to=date_to)
        response = self.client.rpc(
            "match_expense_filtered" if date_from or date_to else "match_expense",
            parameters,
        ).execute()
        
        return response.data or []
