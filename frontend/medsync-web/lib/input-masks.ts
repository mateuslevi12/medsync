import {
  sanitizeBloodPressure,
  sanitizeCep,
  sanitizeCid10,
  sanitizeCns,
  sanitizeCpf,
  sanitizeDate,
  sanitizeDecimal,
  sanitizeInteger,
  sanitizePhone,
} from "@/lib/input-sanitizers";

export function formatCpf(value: string) {
  const digits = sanitizeCpf(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatCns(value: string) {
  const digits = sanitizeCns(value);
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export function formatPhone(value: string) {
  const digits = sanitizePhone(value);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatCep(value: string) {
  const digits = sanitizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function formatBirthDate(value: string) {
  const digits = sanitizeDate(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function formatBloodPressure(value: string) {
  return sanitizeBloodPressure(value);
}

export function formatDecimal(value: string, options?: { maxIntegerDigits?: number; maxDecimalDigits?: number }) {
  return sanitizeDecimal(value, options);
}

export function formatInteger(value: string, options?: { maxDigits?: number }) {
  return sanitizeInteger(value, options);
}

export function formatCid10(value: string) {
  return sanitizeCid10(value);
}
