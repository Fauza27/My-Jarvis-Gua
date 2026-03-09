import { LoginResponse, RegisterResponse, ForgotPasswordResponse } from "../types";
import { useAuthStore } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 10000; // 10 seconds

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

// Helper to create fetch with timeout
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
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
};

// Helper to get valid token (with auto-refresh)
const getValidToken = async (): Promise<string> => {
  const { accessToken, refreshToken: refresh, isTokenExpiringSoon, setAuth, clearAuth } = useAuthStore.getState();
  
  // Check if token is expiring soon
  if (isTokenExpiringSoon() && refresh) {
    try {
      console.log("Token expiring soon, refreshing...");
      const response = await refreshToken(refresh);
      
      // Update store with new tokens
      setAuth(
        response.access_token,
        response.refresh_token,
        response.expires_at,
        response.user
      );
      
      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear auth and redirect to login
      clearAuth();
      if (typeof window !== 'undefined') {
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

export const logout = async (token: string): Promise<void> => {
  // Call backend logout endpoint
  // Backend will handle Supabase signOut internally
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Logout failed" }));
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

export const verifyToken = async (token: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Token verification failed");
  }

  return res.json();
};

export const getGoogleOAuthUrl = async (): Promise<{ url: string; provider: string }> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/google`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to get OAuth URL" }));
    throw new Error(error.detail || "Failed to get OAuth URL");
  }

  return res.json();
};
