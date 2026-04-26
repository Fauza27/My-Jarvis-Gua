
import { GenerateConnectCodeResponse, MessageResponse, Profile, UpdateProfileInput } from "../types";
import { fetchWithTimeout, parseErrorMessage, getAuthHeaders } from "@/lib/fetch";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

export const getMyProfile = async (): Promise<Profile> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to fetch profile"));
  }

  return res.json();
};

export const updateMyProfile = async (payload: UpdateProfileInput): Promise<Profile> => {
  const headers = await getAuthHeaders();

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me`, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to update profile"));
  }

  return res.json();
};

export const generateTelegramConnectCode = async (): Promise<GenerateConnectCodeResponse> => {
  const headers = await getAuthHeaders();

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me/telegram/connect-code`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to generate Telegram connect code"));
  }

  return res.json();
};

export const unlinkTelegramAccount = async (): Promise<MessageResponse> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(`${BASE_URL}/api/profile/me/telegram/unlink`, {
    method: "DELETE",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to unlink Telegram account"));
  }

  return res.json();
};
