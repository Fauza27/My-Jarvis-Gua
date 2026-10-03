import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateTelegramConnectCode,
  getMyProfile,
  unlinkTelegramAccount,
  updateMyProfile,
} from "../api/profileApi";
import { UpdateProfileInput } from "../types";
import { useAuthStore } from "@/features/auth/store";

export const profileQueryKeys = {
  all: ["profile"] as const,
  me: () => [...profileQueryKeys.all, "me"] as const,
};

export function useMyProfile(enabled = true) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...profileQueryKeys.me(), userId],
    queryFn: getMyProfile,
    enabled: enabled && Boolean(userId),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInput) => updateMyProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });
    },
  });
}

export function useGenerateTelegramConnectCode() {
  return useMutation({
    mutationFn: generateTelegramConnectCode,
  });
}

export function useUnlinkTelegramAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkTelegramAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });
    },
  });
}
