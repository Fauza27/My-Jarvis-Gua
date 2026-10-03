import { getValidToken } from "@/features/auth/api/authApi";

const REQUEST_TIMEOUT = 30000; // 30 seconds max for AI endpoints, others can finish earlier

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
) => {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const response = await fetch(url, {
      ...options,
      signal,
    });
    return response;
  } catch (error) {
    if (timeoutSignal.aborted) {
      throw new Error("Request timeout - please try again");
    }
    throw error;
  }
};

export const parseErrorMessage = async (
  res: Response,
  fallbackMessage: string,
): Promise<string> => {
  const error = await res.json().catch(() => ({ detail: fallbackMessage }));
  return error.detail || fallbackMessage;
};

export const getAuthHeaders = async (
  withJsonContentType = true,
): Promise<HeadersInit> => {
  const token = await getValidToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (withJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};
