
import { ChatRequest, ChatResponse, SemanticSearchResponse } from "../types";

const BASE_URL = typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";
const REQUEST_TIMEOUT = 30000;

if (typeof window === "undefined" && !BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

import { fetchWithTimeout, parseErrorMessage, getAuthHeaders } from "@/lib/fetch";

export const sendChatMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const headers = await getAuthHeaders();

  const res = await fetchWithTimeout(`${BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to send chat message"));
  }

  return res.json();
};

export const semanticSearchExpenses = async (query: string, threshold = 0.2, limit = 5): Promise<SemanticSearchResponse> => {
  const headers = await getAuthHeaders(false);

  const params = new URLSearchParams({
    q: query,
    threshold: String(threshold),
    limit: String(limit),
  });

  const res = await fetchWithTimeout(`${BASE_URL}/api/ai/search?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to perform semantic search"));
  }

  return res.json();
};
