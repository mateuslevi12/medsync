const HTML_TAG_REGEX = /<[^>]*>/g;

export function onlyDigits(value: string) {
  return (value ?? "").replace(/\D/g, "");
}

export function onlyLetters(value: string) {
  return (value ?? "").replace(/[^\p{L}]+/gu, "");
}

export function onlyLettersAndSpaces(value: string) {
  return removeExtraSpaces((value ?? "").replace(/[^\p{L}\s]+/gu, " "));
}

export function onlyAlphanumeric(value: string) {
  return (value ?? "").replace(/[^\p{L}\p{N}]+/gu, "");
}

export function removeExtraSpaces(value: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function limitLength(value: string, max: number) {
  return (value ?? "").slice(0, Math.max(0, max));
}

function stripHtml(value: string) {
  return (value ?? "").replace(HTML_TAG_REGEX, " ").replace(/[<>]/g, "");
}

export function sanitizeName(value: string) {
  const cleaned = stripHtml(value).replace(/[^\p{L}\s'’-]/gu, " ");
  return limitLength(removeExtraSpaces(cleaned), 120);
}

export function sanitizeCpf(value: string) {
  return limitLength(onlyDigits(value), 11);
}

export function sanitizeCns(value: string) {
  return limitLength(onlyDigits(value), 15);
}

export function sanitizePhone(value: string) {
  return limitLength(onlyDigits(value), 11);
}

export function sanitizeCep(value: string) {
  return limitLength(onlyDigits(value), 8);
}

export function sanitizeDate(value: string) {
  return limitLength(onlyDigits(value), 8);
}

type NumberSanitizerOptions = {
  maxIntegerDigits?: number;
  maxDecimalDigits?: number;
};

export function sanitizeDecimal(value: string, options: NumberSanitizerOptions = {}) {
  const { maxIntegerDigits = 3, maxDecimalDigits = 2 } = options;
  const cleaned = (value ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, ",");
  const negative = cleaned.startsWith("-") ? "-" : "";
  const unsigned = cleaned.replace(/-/g, "");
  const [integerPartRaw = "", ...decimalParts] = unsigned.split(",");
  const integerPart = limitLength(onlyDigits(integerPartRaw), maxIntegerDigits);
  const decimalPart = limitLength(onlyDigits(decimalParts.join("")), maxDecimalDigits);

  if (!integerPart && !decimalPart) {
    return "";
  }

  if (!decimalPart && unsigned.endsWith(",")) {
    return `${negative}${integerPart},`;
  }

  return decimalPart ? `${negative}${integerPart},${decimalPart}` : `${negative}${integerPart}`;
}

type IntegerSanitizerOptions = {
  maxDigits?: number;
};

export function sanitizeInteger(value: string, options: IntegerSanitizerOptions = {}) {
  const { maxDigits = 3 } = options;
  return limitLength(onlyDigits(value), maxDigits);
}

export function sanitizeBloodPressure(value: string) {
  const digits = limitLength(onlyDigits(value), 6);
  if (digits.length <= 3) {
    return digits;
  }
  return `${digits.slice(0, 3)}/${digits.slice(3, 6)}`;
}

export function sanitizeText(value: string, maxLength: number) {
  const cleaned = stripHtml(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return limitLength(cleaned, maxLength);
}

export function sanitizeCid10(value: string) {
  const cleaned = (value ?? "").toUpperCase().replace(/[^A-Z0-9.]/g, "");
  if (!cleaned) {
    return "";
  }

  const firstLetter = cleaned.slice(0, 1).replace(/[^A-Z]/g, "");
  const remainder = cleaned.slice(1).replace(/[^0-9.]/g, "");
  const compact = `${firstLetter}${remainder.replace(/\./g, "")}`;

  if (compact.length <= 3) {
    return compact;
  }

  return `${compact.slice(0, 3)}.${compact.slice(3, 8)}`;
}

export function sanitizeProcedureCode(value: string) {
  return limitLength(onlyDigits(value), 10);
}

export function normalizeCpf(value: string) {
  return sanitizeCpf(value);
}

export function normalizeCns(value: string) {
  return sanitizeCns(value);
}

export function normalizePhone(value: string) {
  return sanitizePhone(value);
}

export function normalizeCep(value: string) {
  return sanitizeCep(value);
}

export function sanitizeEmail(value: string) {
  return limitLength(stripHtml(value).trim().toLowerCase(), 120);
}

export function sanitizeAddress(value: string, maxLength = 255) {
  return limitLength(removeExtraSpaces(stripHtml(value)), maxLength);
}

export function sanitizeSearchText(value: string, maxLength = 80) {
  return limitLength(removeExtraSpaces(stripHtml(value)), maxLength);
}
