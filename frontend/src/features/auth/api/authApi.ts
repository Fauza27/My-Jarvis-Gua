import { LoginResponse, RegisterResponse, ForgotPasswordResponse } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
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
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
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
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
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
  const res = await fetch(`${BASE_URL}/api/auth/logout`, {
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
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
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
  const res = await fetch(`${BASE_URL}/api/auth/verify`, {
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
