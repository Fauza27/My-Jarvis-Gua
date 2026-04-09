export interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  telegram_linked: boolean;
  auth_provider: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface GenerateConnectCodeResponse {
  code: string;
  expires_in_minutes: number;
  instructions?: string;
}

export interface MessageResponse {
  message: string;
}
