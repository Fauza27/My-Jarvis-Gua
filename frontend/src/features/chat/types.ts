export type ChatRole = "user" | "assistant";

export interface ConversationMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history: ConversationMessage[];
}

export interface ChatResponse {
  reply: string;
  conversation_history: ConversationMessage[];
  action_taken: string[];
}

export interface SearchResultItem {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string | null;
  category: string;
  subcategory: string | null;
  payment_method: string | null;
  transaction_date: string | null;
  similarity: number;
}

export interface SemanticSearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
}
