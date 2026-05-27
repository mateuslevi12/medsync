import type { AuthUser } from "./types";

const STORAGE_KEYS = {
  token: "medsync.token",
  user: "medsync.user"
} as const;

const LEGACY_STORAGE_KEYS = {
  token: "medsync_token",
  user: "medsync_user"
} as const;

const DEFAULT_GATEWAY_URL = "http://localhost:8080";

export function normalizeGateway(url: string): string {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "");
}

export function getGatewayUrl(): string {
  const configuredGateway =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
    process.env.API_GATEWAY_URL ||
    DEFAULT_GATEWAY_URL;

  return normalizeGateway(configuredGateway);
}

export function getToken(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem(STORAGE_KEYS.token) ||
    localStorage.getItem(LEGACY_STORAGE_KEYS.token) ||
    ""
  );
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(STORAGE_KEYS.user) ||
    localStorage.getItem(LEGACY_STORAGE_KEYS.user);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession({
  token,
  user
}: {
  token: string;
  user: AuthUser | null;
}): void {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(LEGACY_STORAGE_KEYS.token, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.token);
  }

  if (user) {
    const serializedUser = JSON.stringify(user);
    localStorage.setItem(STORAGE_KEYS.user, serializedUser);
    localStorage.setItem(LEGACY_STORAGE_KEYS.user, serializedUser);
  } else {
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.user);
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.token);
  localStorage.removeItem(LEGACY_STORAGE_KEYS.user);
}
