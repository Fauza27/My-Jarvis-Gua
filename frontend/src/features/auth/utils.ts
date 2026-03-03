export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return Date.now() / 1000 >= expiresAt;
}

export function getTokenExpiryTime(expiresAt: number): Date {
  return new Date(expiresAt * 1000);
}

export function mapServerError(message: string): string {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("invalid") && (lowerMsg.includes("email") || lowerMsg.includes("password") || lowerMsg.includes("credentials"))) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (lowerMsg.includes("email not confirmed")) {
    return "Your email address has not been confirmed. Please check your inbox for a confirmation email.";
  }

  if (lowerMsg.includes("already exists") || lowerMsg.includes("already registered")) {
    return "An account with this email already exists. Please login instead.";
  }

  if (lowerMsg.includes("too many") || lowerMsg.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (lowerMsg.includes("network") || lowerMsg.includes("fetch") || lowerMsg.includes("failed to fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }

  if (lowerMsg.includes("token") && (lowerMsg.includes("invalid") || lowerMsg.includes("expired"))) {
    return "Your session has expired. Please login again.";
  }

  return message || "An unexpected error occurred. Please try again.";
}
