import { useMutation } from "@tanstack/react-query";
import { login } from "../api/authApi";
import { useAuthStore } from "../store";
import { useRouter } from "next/navigation";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.refresh_token, data.expires_at, data.user);
      router.push("/dashboard");
    },
  });
}
