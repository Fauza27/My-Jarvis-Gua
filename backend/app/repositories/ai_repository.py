from supabase import Client

class AIRepository:
    """Repository for AI-related database operations using Supabase."""

    EXPENSE_TABLE = "expenses"

    def __init__(self, client: Client):
        self.client = client
    
    def save_embedding(self, expense_id: str, embedding: list[float]) -> None:
        """Saves the embedding vector for a given expense ID."""
        self.client.table(self.EXPENSE_TABLE).update(
            {"embedding": embedding}
        ).eq("id", expense_id).execute()
    
    def semantic_search(
        self,
        query_embedding: list[float],
        user_id: str,
        match_threshold: float = 0.5,
        match_count: int = 5,
    ) -> list[dict]:
        """ finds the most similar expenses based on cosine similarity of embeddings."""
        response = self.client.rpc(
            "match_expense",
            {
                "query_embedding": query_embedding,
                "user_id_param": user_id,
                "match_threshold": match_threshold,
                "match_count": match_count
            }
        ).execute()
        
        return response.data or []