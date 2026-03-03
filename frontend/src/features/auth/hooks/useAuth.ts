import { useAuthStore } from "../store";
import { logout as logoutApi } from "../api/authApi";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, refreshToken, isAuthenticated, clearAuth } = useAuthStore();

  const logout = async () => {
    try {
      if (accessToken) {
        await logoutApi(accessToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      router.push("/login");
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
