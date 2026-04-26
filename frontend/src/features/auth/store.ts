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
      },

      clearAuth: () => {
        set({ ...initialState, hasHydrated: true });
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
        expiresAt: state.expiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastUpdate: state.lastUpdate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        if (state?.expiresAt && state.isAuthenticated) {
          const currentTime = Math.floor(Date.now() / 1000);
          if (state.expiresAt <= currentTime) {
            state.clearAuth();
          }
        }
      },
    },
  ),
);
