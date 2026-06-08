import { parseApiError } from "@/lib/api";

export function isDemoModeEnabled() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function getServiceErrorMessage(error: unknown, fallback: string) {
  const parsed = parseApiError(error);
  return parsed.message || fallback;
}

export function inferBirthDateFromAge(age?: number | string | null) {
  const numericAge = Number(age);
  const today = new Date();

  if (!Number.isFinite(numericAge) || numericAge < 0) {
    return new Date(today.getFullYear() - 30, 0, 1).toISOString().slice(0, 10);
  }

  return new Date(today.getFullYear() - numericAge, 0, 1).toISOString().slice(0, 10);
}
