import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthState, User } from "./types";

interface AuthActions {
  setAuth: (accessToken: string, refreshToken: string, expiresAt: number, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (isLoading: boolean) => void;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (accessToken, refreshToken, expiresAt, user) =>
        set({
          accessToken,
          refreshToken,
          expiresAt,
          user,
          isAuthenticated: true,
        }),
      clearAuth: () => set(initialState),
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
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
      }),
    }
  )
);
