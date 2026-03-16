import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthState, User } from "./types";

interface AuthActions {
  setAuth: (accessToken: string, refreshToken: string, expiresAt: number, user: User) => void;
  clearAuth: () => void;
  markHydrated: () => void;
  setUser: (user: User) => void;
  setLoading: (isLoading: boolean) => void;
  isTokenExpired: () => boolean;
  isTokenExpiringSoon: () => boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  lastUpdate: undefined,
};

function setAuthCookie(expiresAt: number) {
  const maxAge = expiresAt - Math.floor(Date.now() / 1000);
  if (maxAge <= 0) return;
  document.cookie = ["auth_session=1", `max-age=${maxAge}`, "path=/", "samesite=lax"].join("; ");
}

function clearAuthCookie() {
  document.cookie = "auth_session=; max-age=0; path=/";
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (accessToken, refreshToken, expiresAt, user) => {
        const timestamp = Date.now();
        const state = get();

        if (state.lastUpdate && timestamp < state.lastUpdate) {
          console.warn("Ignoring stale auth update");
          return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
          console.error("Invalid token expiration");
          return;
        }
        if (expiresAt <= currentTime) {
          console.error("Token sudah expired, tidak disimpan");
          return;
        }

        set({
          accessToken,
          refreshToken,
          expiresAt,
          user,
          isAuthenticated: true,
          hasHydrated: true,
          lastUpdate: timestamp,
        });

        setAuthCookie(expiresAt);
      },

      clearAuth: () => {
        set({ ...initialState, hasHydrated: true });

        clearAuthCookie();
      },

      markHydrated: () => set({ hasHydrated: true }),

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return Math.floor(Date.now() / 1000) >= expiresAt;
      },

      isTokenExpiringSoon: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        const fiveMinutes = 300;
        return Math.floor(Date.now() / 1000) >= expiresAt - fiveMinutes;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastUpdate: state.lastUpdate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();

        if (state?.expiresAt && state.isAuthenticated) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (state.expiresAt > currentTime) {
            setAuthCookie(state.expiresAt);
          } else {
            state.clearAuth();
          }
        }
      },
    },
  ),
);
