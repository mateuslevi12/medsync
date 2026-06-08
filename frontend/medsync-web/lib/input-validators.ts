import {
  normalizeCep,
  normalizeCns,
  normalizeCpf,
  normalizePhone,
  sanitizeText,
} from "@/lib/input-sanitizers";

export function parseBrazilianDateToIso(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return iso;
}

export function formatIsoDateToBrazilian(value?: string | null) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function isFutureDate(isoDate: string) {
  const today = new Date();
  const current = new Date(`${isoDate}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return current.getTime() > today.getTime();
}

export function validateCpf(value: string) {
  const normalized = normalizeCpf(value);
  if (normalized && normalized.length !== 11) {
    return "CPF deve conter 11 dígitos.";
  }
  return "";
}

export function validateCns(value: string, required = false) {
  const normalized = normalizeCns(value);
  if (required && normalized.length !== 15) {
    return "CNS deve conter 15 dígitos.";
  }
  if (!required && normalized && normalized.length !== 15) {
    return "CNS deve conter 15 dígitos.";
  }
  return "";
}

export function validatePhone(value: string) {
  const normalized = normalizePhone(value);
  if (normalized.length < 10) {
    return "Telefone deve conter DDD e número.";
  }
  return "";
}

export function validateBirthDate(value: string) {
  const iso = parseBrazilianDateToIso(value);
  if (!iso || isFutureDate(iso)) {
    return "Informe uma data válida.";
  }
  return "";
}

export function validateDecimalRange(
  value: string,
  { min, max, message }: { min: number; max: number; message: string }
) {
  if (!value) {
    return "";
  }
  const numeric = Number(value.replace(",", "."));
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    return message;
  }
  return "";
}

export function validateIntegerRange(
  value: string,
  { min, max, message }: { min: number; max: number; message: string }
) {
  if (!value) {
    return "";
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
    return message;
  }
  return "";
}

export function validateBloodPressure(value: string) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{2,3})\/(\d{2,3})$/);
  if (!match) {
    return "Informe a pressão no formato 120/80.";
  }

  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (systolic < 40 || systolic > 300 || diastolic < 20 || diastolic > 200) {
    return "Informe a pressão no formato 120/80.";
  }

  return "";
}

export function validateRequiredText(
  value: string,
  { min = 1, message }: { min?: number; message: string }
) {
  const sanitized = sanitizeText(value, Number.MAX_SAFE_INTEGER);
  if (sanitized.length < min) {
    return message;
  }
  return "";
}

export function validateCid10(value: string) {
  if (!value) {
    return "";
  }

  if (!/^[A-Z]\d{2}(\.\d{1,4})?$/.test(value)) {
    return "Informe um CID-10 válido.";
  }

  return "";
}

export function validateCep(value: string) {
  const normalized = normalizeCep(value);
  if (normalized && normalized.length !== 8) {
    return "CEP deve conter 8 dígitos.";
  }
  return "";
}
