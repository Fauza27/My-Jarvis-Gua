import { useAuthStore } from "../store";
import { logout as logoutApi } from "../api/authApi";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, refreshToken, isAuthenticated, clearAuth } =
    useAuthStore();

  const logout = async () => {
    clearAuth();
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } finally {
        clearAuth();
        router.push("/login");
      }
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    logout,
  };
}
