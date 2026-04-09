import { getValidToken } from "@/features/auth/api/authApi";
import { GenerateConnectCodeResponse, MessageResponse, Profile, UpdateProfileInput } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 15000;

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

export const getMyProfile = async (): Promise<Profile> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to fetch profile"));
  }

  return res.json();
};

export const updateMyProfile = async (payload: UpdateProfileInput): Promise<Profile> => {
  const headers = await getAuthHeaders();

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me`, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to update profile"));
  }

  return res.json();
};

export const generateTelegramConnectCode = async (): Promise<GenerateConnectCodeResponse> => {
  const headers = await getAuthHeaders();

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me/telegram/connect-code`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to generate Telegram connect code"));
  }

  return res.json();
};

export const unlinkTelegramAccount = async (): Promise<MessageResponse> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me/telegram/unlink`, {
    method: "DELETE",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to unlink Telegram account"));
  }

  return res.json();
};
