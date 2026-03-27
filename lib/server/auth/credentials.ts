import "server-only";

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizePassword(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function validateCredentials(email: string, password: string): string | null {
  if (!email || !EMAIL_PATTERN.test(email)) {
    return "A valid email is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
