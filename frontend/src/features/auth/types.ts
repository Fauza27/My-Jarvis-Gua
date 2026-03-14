export interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  lastUpdate?: number;
}
