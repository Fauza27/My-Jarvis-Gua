import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateTelegramConnectCode, getMyProfile, unlinkTelegramAccount, updateMyProfile } from "../api/profileApi";
import { UpdateProfileInput } from "../types";

export const profileQueryKeys = {
  all: ["profile"] as const,
  me: () => [...profileQueryKeys.all, "me"] as const,
};

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: getMyProfile,
    enabled,
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
