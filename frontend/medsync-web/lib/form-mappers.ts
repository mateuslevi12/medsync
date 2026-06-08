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
import type { MedicalConductsState } from "@/lib/types";

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

export function mapMedicalConductsToPayload(conducts: MedicalConductsState) {
  return {
    medications: conducts.medications.map((item) => ({
      id: sanitizeText(item.id, 80),
      medicationName: sanitizeText(item.medicationName, 120),
      protocol: sanitizeText(item.protocol || "", 120),
      scheduledAt: sanitizeText(item.scheduledAt, 40),
      dosage: sanitizeText(item.dosage, 500),
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    procedures: conducts.procedures.map((item) => ({
      id: sanitizeText(item.id, 80),
      procedureName: sanitizeText(item.procedureName, 120),
      protocol: sanitizeText(item.protocol || "", 120),
      scheduledAt: sanitizeText(item.scheduledAt, 40),
      observations: sanitizeText(item.observations || "", 500),
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    observationPrescriptions: conducts.observationPrescriptions.map((item) => ({
      id: sanitizeText(item.id, 80),
      title: sanitizeText(item.title, 120),
      description: sanitizeText(item.description, 1000),
      observationTime: sanitizeText(item.observationTime || "", 120),
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    exams: conducts.exams.map((item) => ({
      id: sanitizeText(item.id, 80),
      examName: sanitizeText(item.examName, 120),
      protocol: sanitizeText(item.protocol || "", 120),
      observations: sanitizeText(item.observations || "", 500),
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    orientations: conducts.orientations.map((item) => ({
      id: sanitizeText(item.id, 80),
      title: sanitizeText(item.title, 120),
      text: sanitizeText(item.text, 2000),
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    certificates: conducts.certificates.map((item) => ({
      id: sanitizeText(item.id, 80),
      issueDate: sanitizeText(item.issueDate, 20),
      startDate: sanitizeText(item.startDate, 20),
      days: item.days,
      text: sanitizeText(item.text, 2000),
      includeCidCode: item.includeCidCode,
      includeCidDescription: item.includeCidDescription,
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    declarations: conducts.declarations.map((item) => ({
      id: sanitizeText(item.id, 80),
      startDateTime: sanitizeText(item.startDateTime, 40),
      endDateTime: sanitizeText(item.endDateTime, 40),
      text: sanitizeText(item.text, 2000),
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
    recipes: conducts.recipes.map((item) => ({
      id: sanitizeText(item.id, 80),
      fillMode: item.fillMode,
      recipeType: item.recipeType,
      favoriteName: sanitizeText(item.favoriteName || "", 120),
      text: sanitizeText(item.text, 3000),
      saveAsFavorite: item.saveAsFavorite,
      status: item.status,
      createdAt: sanitizeText(item.createdAt, 40),
    })),
  };
}

export function mapQueueSearchQuery(value: string) {
  return sanitizeSearchText(value, 80);
}
