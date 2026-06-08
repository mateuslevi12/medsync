import type { RiskLevel } from "@/lib/medsync-demo";
import type { AllergySeverity, AllergyType, RiskClassification, VaccineStatus } from "@/lib/types";
import {
  createPatientAllergy,
  createPatientVaccine,
  deletePatientAllergy,
  getPatientAllergies,
  getPatientVaccines,
  updatePatientVaccine,
} from "@/services/patients";

type ServiceOptions = {
  demo?: boolean;
};

export type TriageClinicalPayload = {
  hasAllergy: boolean;
  allergyType: string;
  allergyDescription: string;
  allergySeverity: string;
  vaccines: Array<{ name: string; status: string }>;
};

export function riskLabelToClassification(value: RiskLevel): RiskClassification {
  switch (value) {
    case "EMERGÊNCIA":
      return "EMERGENCIA";
    case "MUITO URGENTE":
      return "MUITO_URGENTE";
    case "URGENTE":
      return "URGENTE";
    case "POUCO URGENTE":
      return "POUCO_URGENTE";
    case "NÃO URGENTE":
      return "NAO_URGENTE";
  }
}

export function riskClassificationToLabel(value?: RiskClassification | null): RiskLevel | null {
  if (!value) {
    return null;
  }

  switch (value) {
    case "EMERGENCIA":
      return "EMERGÊNCIA";
    case "MUITO_URGENTE":
      return "MUITO URGENTE";
    case "URGENTE":
      return "URGENTE";
    case "POUCO_URGENTE":
      return "POUCO URGENTE";
    case "NAO_URGENTE":
      return "NÃO URGENTE";
  }
}

export function vaccineStatusLabelToApi(status: string): VaccineStatus {
  switch (status) {
    case "Em dia":
      return "EM_DIA";
    case "Pendente":
      return "PENDENTE";
    default:
      return "DESCONHECIDO";
  }
}

export function vaccineStatusApiToLabel(status?: string | null) {
  if (status === "EM_DIA") return "Em dia";
  if (status === "PENDENTE") return "Pendente";
  return "Desconhecido";
}

function allergyTypeToApi(type: string): AllergyType {
  if (type.toUpperCase() === "ALIMENTO") return "ALIMENTO";
  if (type.toUpperCase() === "OUTRO") return "OUTRO";
  return "MEDICAMENTO";
}

function allergySeverityToApi(value: string): AllergySeverity {
  if (value.toUpperCase() === "GRAVE") return "GRAVE";
  if (value.toUpperCase() === "LEVE") return "LEVE";
  return "MODERADA";
}

export async function syncPatientClinicalInfo(
  patientId: number,
  payload: TriageClinicalPayload,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    return;
  }

  const existingAllergies = await getPatientAllergies(patientId);
  await Promise.all(existingAllergies.map((allergy) => deletePatientAllergy(patientId, allergy.id)));

  if (payload.hasAllergy && (payload.allergyDescription.trim() || payload.allergyType.trim())) {
    await createPatientAllergy(patientId, {
      type: allergyTypeToApi(payload.allergyType || "Medicamento"),
      description: payload.allergyDescription.trim() || payload.allergyType.trim(),
      severity: allergySeverityToApi(payload.allergySeverity || "Moderada"),
    });
  }

  const existingVaccines = await getPatientVaccines(patientId);

  for (const vaccine of payload.vaccines) {
    const current = existingVaccines.find(
      (item) => item.name.trim().toLowerCase() === vaccine.name.trim().toLowerCase()
    );

    const body = {
      name: vaccine.name,
      status: vaccineStatusLabelToApi(vaccine.status),
      applicationDate: null,
      notes: null,
    };

    if (current) {
      await updatePatientVaccine(patientId, current.id, body);
    } else {
      await createPatientVaccine(patientId, body);
    }
  }
}
