import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthState, User } from "./types";

interface AuthActions {
  setAuth: (accessToken: string, refreshToken: string, expiresAt: number, user: User) => void;
  clearAuth: () => void;
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
  lastUpdate: undefined,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setAuth: (accessToken, refreshToken, expiresAt, user) => {
        const timestamp = Date.now();
        const state = get();
        
        // Prevent race condition - only update if newer
        if (state.lastUpdate && timestamp < state.lastUpdate) {
          console.warn("Ignoring stale auth update", {
            current: state.lastUpdate,
            attempted: timestamp,
          });
          return;
        }
        
        // Validate expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (expiresAt <= currentTime) {
          console.error("Attempted to set expired token");
          return;
        }
        
        set({
          accessToken,
          refreshToken,
          expiresAt,
          user,
          isAuthenticated: true,
          lastUpdate: timestamp,
        });
      },
      
      clearAuth: () => set(initialState),
      
      setUser: (user) => set({ user }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      isTokenExpired: () => {
        const state = get();
        if (!state.expiresAt) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime >= state.expiresAt;
      },
      
      isTokenExpiringSoon: () => {
        const state = get();
        if (!state.expiresAt) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        const fiveMinutes = 300;
        return currentTime >= (state.expiresAt - fiveMinutes);
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
    }
  )
);
