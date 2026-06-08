import { formatCpf, formatPhone } from "@/lib/input-masks";
import { onlyDigits } from "@/lib/input-sanitizers";

export function formatPatientGender(value?: string) {
  const normalized = (value ?? "").toUpperCase();

  if (normalized === "MALE") return "Masculino";
  if (normalized === "FEMALE") return "Feminino";
  if (normalized === "OTHER") return "Outro";
  return value || "Não informado";
}

export function formatPatientDate(value?: string) {
  if (!value) return "Não informado";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function formatPatientDocument(value?: string) {
  const digits = onlyDigits(value || "");

  if (digits.length !== 11) {
    return value || "Não informado";
  }

  return formatCpf(digits);
}

export function formatPatientPhone(value?: string) {
  const digits = onlyDigits(value || "");

  if (digits.length === 10 || digits.length === 11) {
    return formatPhone(digits);
  }

  return value || "Não informado";
}

export function getPatientInitials(name?: string) {
  if (!name) return "MS";

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "MS";
}
