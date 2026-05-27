import { clearSession, getToken, persistSession } from "./session";

export const TOKEN_KEY = "medsync.token";
export const USER_KEY = "medsync.user";

export { clearSession, getToken };

export function saveToken(token: string): void {
  persistSession({ token, user: null });
}
