import { apiRequest } from "@/lib/api";
import { mapPatientFormToPayload, mapQueueSearchQuery } from "@/lib/form-mappers";
import { createDemoPatient, getDemoPatients, getTriageByPatientId, updateDemoPatient } from "@/lib/medsync-demo";
import type {
  AllergySeverity,
  AllergyType,
  Gender,
  PatientAllergyResponse,
  PatientResponse,
  PatientVaccineResponse,
  VaccineStatus,
} from "@/lib/types";

type ServiceOptions = {
  demo?: boolean;
};

type CreatePatientInput = {
  fullName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  documentNumber: string;
  cns?: string;
  address: string;
};

type CreatePatientAllergyInput = {
  type: AllergyType;
  description: string;
  severity: AllergySeverity;
};

type CreatePatientVaccineInput = {
  name: string;
  status: VaccineStatus;
  applicationDate?: string | null;
  notes?: string | null;
};

let cachedApiPatients: PatientResponse[] | null = null;

export type SearchPatientResult = {
  id: number;
  fullName: string;
  documentNumber: string;
  cns?: string | null;
  birthDate?: string | null;
  age?: number | null;
  phone?: string | null;
};

function calculateAgeFromBirthDate(birthDate?: string | null) {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const parsedBirthDate = new Date(birthDate);
  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDelta = today.getMonth() - parsedBirthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsedBirthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function mapDemoPatient(patient: ReturnType<typeof getDemoPatients>[number]): PatientResponse {
  return {
    id: Number(patient.id),
    fullName: patient.fullName,
    birthDate: patient.birthDate,
    gender:
      patient.gender === "Masculino"
        ? "MALE"
        : patient.gender === "Feminino"
          ? "FEMALE"
          : "OTHER",
    phone: patient.phone,
    documentNumber: patient.cpf,
    cns: patient.cns,
    address: patient.address,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapDemoAllergies(patientId: number): PatientAllergyResponse[] {
  const triage = getTriageByPatientId(String(patientId));

  if (!triage?.hasAllergy) {
    return [];
  }

  return [
    {
      id: patientId,
      patientId,
      type: triage.allergyType?.toUpperCase() === "ALIMENTO" ? "ALIMENTO" : triage.allergyType?.toUpperCase() === "OUTRO" ? "OUTRO" : "MEDICAMENTO",
      description: triage.allergyDescription || triage.allergyType || "Alergia registrada no acolhimento",
      severity:
        triage.allergySeverity?.toUpperCase() === "GRAVE"
          ? "GRAVE"
          : triage.allergySeverity?.toUpperCase() === "LEVE"
            ? "LEVE"
            : "MODERADA",
      createdAt: new Date().toISOString(),
    },
  ];
}

function mapDemoVaccines(patientId: number): PatientVaccineResponse[] {
  const triage = getTriageByPatientId(String(patientId));

  return (triage?.vaccines || []).map((vaccine, index) => ({
    id: index + 1,
    patientId,
    name: vaccine.name,
    status:
      vaccine.status === "Em dia"
        ? "EM_DIA"
        : vaccine.status === "Pendente"
          ? "PENDENTE"
          : "DESCONHECIDO",
    applicationDate: null,
    notes: null,
    createdAt: new Date().toISOString(),
  }));
}

export async function getPatients(options: ServiceOptions = {}) {
  if (options.demo) {
    return getDemoPatients().map(mapDemoPatient);
  }

  return apiRequest<PatientResponse[]>("/api/patients");
}

export async function getPatientById(patientId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    const patient = getDemoPatients().find((item) => item.id === String(patientId));
    return patient ? mapDemoPatient(patient) : null;
  }

  return apiRequest<PatientResponse>(`/api/patients/${patientId}`);
}

export async function createPatient(input: CreatePatientInput, options: ServiceOptions = {}) {
  const payload = mapPatientFormToPayload(input);

  if (options.demo) {
    const createdPatient = createDemoPatient({
      fullName: payload.fullName,
      cpf: payload.documentNumber,
      cns: payload.cns || "",
      birthDate: payload.birthDate,
      phone: payload.phone,
      address: payload.address,
      gender: payload.gender === "MALE" ? "Masculino" : payload.gender === "FEMALE" ? "Feminino" : "Outro",
    });

    return mapDemoPatient(createdPatient);
  }

  cachedApiPatients = null;
  return apiRequest<PatientResponse>("/api/patients", {
    method: "POST",
    body: payload,
  });
}

export async function updatePatient(patientId: number | string, input: CreatePatientInput, options: ServiceOptions = {}) {
  const payload = mapPatientFormToPayload(input);

  if (options.demo) {
    const updatedPatient = updateDemoPatient(String(patientId), {
      fullName: payload.fullName,
      cpf: payload.documentNumber,
      cns: payload.cns || "",
      birthDate: payload.birthDate,
      phone: payload.phone,
      address: payload.address,
      gender: payload.gender === "MALE" ? "Masculino" : payload.gender === "FEMALE" ? "Feminino" : "Outro",
    });

    return mapDemoPatient(updatedPatient);
  }

  cachedApiPatients = null;
  return apiRequest<PatientResponse>(`/api/patients/${patientId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function getPatientAllergies(patientId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    return mapDemoAllergies(Number(patientId));
  }

  return apiRequest<PatientAllergyResponse[]>(`/api/patients/${patientId}/allergies`);
}

export async function createPatientAllergy(
  patientId: number | string,
  input: CreatePatientAllergyInput,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    return {
      id: Date.now(),
      patientId: Number(patientId),
      ...input,
      createdAt: new Date().toISOString(),
    } satisfies PatientAllergyResponse;
  }

  return apiRequest<PatientAllergyResponse>(`/api/patients/${patientId}/allergies`, {
    method: "POST",
    body: input,
  });
}

export async function deletePatientAllergy(
  patientId: number | string,
  allergyId: number | string,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    return;
  }

  await apiRequest<void>(`/api/patients/${patientId}/allergies/${allergyId}`, {
    method: "DELETE",
  });
}

export async function getPatientVaccines(patientId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    return mapDemoVaccines(Number(patientId));
  }

  return apiRequest<PatientVaccineResponse[]>(`/api/patients/${patientId}/vaccines`);
}

export async function createPatientVaccine(
  patientId: number | string,
  input: CreatePatientVaccineInput,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    return {
      id: Date.now(),
      patientId: Number(patientId),
      ...input,
      createdAt: new Date().toISOString(),
    } satisfies PatientVaccineResponse;
  }

  return apiRequest<PatientVaccineResponse>(`/api/patients/${patientId}/vaccines`, {
    method: "POST",
    body: input,
  });
}

export async function updatePatientVaccine(
  patientId: number | string,
  vaccineId: number | string,
  input: CreatePatientVaccineInput,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    return {
      id: Number(vaccineId),
      patientId: Number(patientId),
      ...input,
      createdAt: new Date().toISOString(),
    } satisfies PatientVaccineResponse;
  }

  return apiRequest<PatientVaccineResponse>(`/api/patients/${patientId}/vaccines/${vaccineId}`, {
    method: "PUT",
    body: input,
  });
}

function normalizePatientSearchResult(patient: PatientResponse): SearchPatientResult {
  return {
    id: patient.id,
    fullName: patient.fullName,
    documentNumber: patient.documentNumber,
    cns: patient.cns || null,
    birthDate: patient.birthDate,
    age: calculateAgeFromBirthDate(patient.birthDate),
    phone: patient.phone || null,
  };
}

function filterPatients(patients: PatientResponse[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const digitsOnlyQuery = query.replace(/\D/g, "");

  return patients.filter((patient) => {
    const normalizedName = patient.fullName.toLowerCase();
    const normalizedCpf = patient.documentNumber.toLowerCase();
    const normalizedCns = (patient.cns || "").toLowerCase();
    const cpfDigits = patient.documentNumber.replace(/\D/g, "");
    const cnsDigits = (patient.cns || "").replace(/\D/g, "");

    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedCpf.includes(normalizedQuery) ||
      normalizedCns.includes(normalizedQuery) ||
      (digitsOnlyQuery.length > 0 &&
        (cpfDigits.includes(digitsOnlyQuery) || cnsDigits.includes(digitsOnlyQuery)))
    );
  });
}

export async function searchPatients(query: string, options: ServiceOptions = {}) {
  const normalizedQuery = mapQueueSearchQuery(query);

  if (normalizedQuery.length < 2) {
    return [] satisfies SearchPatientResult[];
  }

  try {
    let patients: PatientResponse[];

    if (options.demo) {
      patients = await getPatients(options);
    } else if (cachedApiPatients) {
      patients = cachedApiPatients;
    } else {
      patients = await getPatients(options);
      cachedApiPatients = patients;
    }

    return filterPatients(patients, normalizedQuery).map(normalizePatientSearchResult);
  } catch (error) {
    if (options.demo) {
      throw error;
    }

    const demoPatients = await getPatients({ demo: true });
    return filterPatients(demoPatients, normalizedQuery).map(normalizePatientSearchResult);
  }
}
