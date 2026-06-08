import {
  normalizeCns,
  normalizeCpf,
  normalizePhone,
  sanitizeAddress,
  sanitizeCid10,
  sanitizeName,
  sanitizeProcedureCode,
  sanitizeSearchText,
  sanitizeText,
} from "@/lib/input-sanitizers";
import { parseBrazilianDateToIso } from "@/lib/input-validators";

export function mapPatientFormToPayload(form: {
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  documentNumber: string;
  cns?: string;
  address: string;
}) {
  return {
    fullName: sanitizeName(form.fullName),
    birthDate: parseBrazilianDateToIso(form.birthDate) ?? form.birthDate,
    gender: form.gender,
    phone: normalizePhone(form.phone),
    documentNumber: normalizeCpf(form.documentNumber),
    cns: normalizeCns(form.cns || ""),
    address: sanitizeAddress(form.address),
  };
}

export function mapAllergyFormToPayload(form: {
  hasAllergy: boolean;
  allergyType: string;
  allergyDescription: string;
  allergySeverity: string;
}) {
  if (!form.hasAllergy) {
    return {
      hasAllergy: false,
      allergyType: "",
      allergyDescription: "",
      allergySeverity: "",
    };
  }

  return {
    hasAllergy: true,
    allergyType: form.allergyType,
    allergyDescription: sanitizeText(form.allergyDescription, 120),
    allergySeverity: form.allergySeverity,
  };
}

export function mapVaccineFormToPayload(vaccines: Array<{ name: string; status: string }>) {
  return vaccines.map((vaccine) => ({
    name: sanitizeText(vaccine.name, 80),
    status: vaccine.status,
  }));
}

export function mapTriageFormToPayload(form: {
  observations: string;
  destination: string;
  weightKg: string;
  heightCm: string;
  bmi: string;
  abdominalCircumference: string;
  bloodPressure: string;
  respiratoryRate: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  glucose: string;
  painLevel: string;
  hasAllergy: boolean;
  allergyType: string;
  allergyDescription: string;
  allergySeverity: string;
  vaccines: Array<{ name: string; status: string }>;
}) {
  const allergy = mapAllergyFormToPayload(form);

  return {
    observations: sanitizeText(form.observations, 1000),
    destination: sanitizeText(form.destination, 120),
    weightKg: form.weightKg,
    heightCm: form.heightCm,
    bmi: form.bmi,
    abdominalCircumference: form.abdominalCircumference,
    bloodPressure: form.bloodPressure,
    respiratoryRate: form.respiratoryRate,
    heartRate: form.heartRate,
    temperature: form.temperature,
    oxygenSaturation: form.oxygenSaturation,
    glucose: form.glucose,
    painLevel: form.painLevel ? Number(form.painLevel) : undefined,
    ...allergy,
    vaccines: mapVaccineFormToPayload(form.vaccines),
  };
}

export function mapMedicalFormToPayload(form: {
  assessment: string;
  plan: string;
  procedureCode: string;
  cidCodes: string[];
  notifications: string;
  accidentMoto: boolean;
  accidentCarro: boolean;
  accidentBicicleta: boolean;
  accidentPedestre: boolean;
  accidentOutros: boolean;
}) {
  return {
    assessment: sanitizeText(form.assessment, 2000),
    plan: sanitizeText(form.plan, 2000),
    procedureCode: sanitizeProcedureCode(form.procedureCode),
    cidCodes: form.cidCodes.map((code) => sanitizeCid10(code)).filter(Boolean),
    notifications: form.notifications === "Pesquisar..." ? "" : sanitizeText(form.notifications, 255),
    accidentMoto: form.accidentMoto,
    accidentCarro: form.accidentCarro,
    accidentBicicleta: form.accidentBicicleta,
    accidentPedestre: form.accidentPedestre,
    accidentOutros: form.accidentOutros,
  };
}

export function mapQueueSearchQuery(value: string) {
  return sanitizeSearchText(value, 80);
}
