import { LoginResponse, RegisterResponse, ForgotPasswordResponse } from "../types";
import { useAuthStore } from "../store";

const BASE_URL = typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";

if (typeof window === "undefined" && !BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

import { fetchWithTimeout } from "@/lib/fetch";

// Helper to get valid token (with auto-refresh)
export const getValidToken = async (): Promise<string> => {
  const { accessToken, refreshToken: refresh, isTokenExpiringSoon, setAuth, clearAuth } = useAuthStore.getState();

  // Check if token is expiring soon
  if (isTokenExpiringSoon() && refresh) {
    try {
      console.log("Token expiring soon, refreshing...");
      const response = await refreshToken(refresh);

      // Update store with new tokens
      setAuth(response.access_token, response.refresh_token, response.expires_at, response.user);

      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear auth and redirect to login
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw error;
    }
  }

  return accessToken || "";
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(error.detail || "Login failed");
  }

  return res.json();
};

export const register = async (email: string, password: string): Promise<RegisterResponse> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(error.detail || "Registration failed");
  }

  return res.json();
};

export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
};

export const logout = async (token?: string): Promise<void> => {
  const resolvedToken = token || (await getValidToken());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Logout failed" }));
    const detail = String(error.detail || "").toLowerCase();

    if (res.status === 401 && (detail.includes("invalid") || detail.includes("expired") || detail.includes("token"))) {
      return;
    }

    throw new Error(error.detail || "Logout failed");
  }
};

export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Token refresh failed" }));
    throw new Error(error.detail || "Token refresh failed");
  }

  return res.json();
};

export const verifyToken = async (token?: string) => {
  const resolvedToken = token || (await getValidToken());
  const headers: Record<string, string> = {};
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/verify`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Token verification failed");
  }

  return res.json();
};

export const syncSessionCookies = async (payload: { access_token: string; refresh_token: string; expires_at: number }): Promise<void> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Session sync failed" }));
    throw new Error(error.detail || "Session sync failed");
  }
};
