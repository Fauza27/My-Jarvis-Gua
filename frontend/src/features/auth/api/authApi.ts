import {
  LoginResponse,
  RegisterResponse,
  ForgotPasswordResponse,
} from "../types";
import { useAuthStore } from "../store";
import { getDeviceTimezone } from "@/lib/device-time";

const BASE_URL =
  typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";

if (typeof window === "undefined" && !BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

import { fetchWithTimeout } from "@/lib/fetch";

let refreshInFlight: Promise<LoginResponse> | null = null;
let tokenInFlight: Promise<string> | null = null;

// Production authenticates using HttpOnly cookies; an empty bearer token is valid.
export const getValidToken = async (forceRefresh = false): Promise<string> => {
  if (!tokenInFlight) {
    tokenInFlight = resolveValidToken(forceRefresh).finally(() => {
      tokenInFlight = null;
    });
  }
  return tokenInFlight;
};

async function resolveValidToken(forceRefresh: boolean): Promise<string> {
  const state = useAuthStore.getState();
  if (forceRefresh || !state.isAuthenticated || state.isTokenExpiringSoon()) {
    const sessionVersion = state.sessionVersion;
    try {
      const response = await refreshToken(state.refreshToken || undefined);
      // A response from a previous session must not resurrect it after logout.
      if (useAuthStore.getState().sessionVersion !== sessionVersion) {
        throw new Error("Authentication session changed");
      }
      state.setAuth(
        response.access_token,
        response.refresh_token,
        response.expires_at,
        response.user,
      );
      return response.access_token;
    } catch (error) {
      if (
        error instanceof SessionExpiredError &&
        useAuthStore.getState().sessionVersion === sessionVersion
      ) {
        state.clearAuth();
      }
      throw error;
    }
  }

  return state.accessToken || "";
}

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password, timezone: getDeviceTimezone() }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(error.detail || "Login failed");
  }

  return res.json();
};

export const register = async (
  email: string,
  password: string,
): Promise<RegisterResponse> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Registration failed" }));
    throw new Error(error.detail || "Registration failed");
  }

  return res.json();
};

export const forgotPassword = async (
  email: string,
): Promise<ForgotPasswordResponse> => {
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
  // Finish refresh first so its Set-Cookie cannot arrive after cookie deletion.
  if (refreshInFlight) await refreshInFlight.catch(() => undefined);
  const resolvedToken = token || useAuthStore.getState().accessToken;
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

    if (
      res.status === 401 &&
      (detail.includes("invalid") ||
        detail.includes("expired") ||
        detail.includes("token"))
    ) {
      return;
    }

    throw new Error(error.detail || "Logout failed");
  }
};

class SessionExpiredError extends Error {}

export const refreshToken = (token?: string): Promise<LoginResponse> => {
  if (!refreshInFlight) {
    refreshInFlight = requestRefresh(token).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

async function requestRefresh(token?: string): Promise<LoginResponse> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      refresh_token: token,
      timezone: getDeviceTimezone(),
    }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Token refresh failed" }));
    if (res.status === 401)
      throw new SessionExpiredError(error.detail || "Session expired");
    throw new Error(error.detail || "Token refresh failed");
  }

  return res.json();
}

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

export const syncSessionCookies = async (payload: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}): Promise<void> => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ ...payload, timezone: getDeviceTimezone() }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Session sync failed" }));
    throw new Error(error.detail || "Session sync failed");
  }
};
