import { getValidToken } from "@/features/auth/api/authApi";
import { ChatRequest, ChatResponse, SemanticSearchResponse } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 30000;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw error;
  }
};

const parseErrorMessage = async (res: Response, fallbackMessage: string): Promise<string> => {
  const error = await res.json().catch(() => ({ detail: fallbackMessage }));
  return error.detail || fallbackMessage;
};

const getAuthHeaders = async (withJsonContentType = true): Promise<HeadersInit> => {
  const token = await getValidToken();

  if (!token) {
    throw new Error("No valid access token available");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (withJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

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
