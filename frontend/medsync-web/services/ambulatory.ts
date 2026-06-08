import { apiRequest } from "@/lib/api";
import {
  getDemoQueue,
  getMedicalByPatientId as getDemoMedical,
  getPatientById as getDemoPatient,
  getQueueWithPatients,
  getTriageByPatientId,
  upsertDemoMedical,
  upsertDemoTriage,
  upsertDemoQueueItem,
} from "@/lib/medsync-demo";
import type {
  AmbulatoryAttendanceResponse,
  MedicalConductsState,
  AmbulatoryPriority,
  AmbulatoryStatus,
  RiskClassification,
} from "@/lib/types";

type ServiceOptions = {
  demo?: boolean;
};

export type CreateAmbulatoryAttendanceInput = {
  patientId: number;
  patientName: string;
  patientCpf: string;
  patientCns?: string;
  patientPhone?: string;
  patientAge?: number;
  queueName?: string;
  priority?: AmbulatoryPriority;
};

export type CompleteTriageInput = {
  observations?: string;
  destination: string;
  riskClassification: RiskClassification;
  weightKg?: string;
  heightCm?: string;
  bmi?: string;
  abdominalCircumference?: string;
  bloodPressure?: string;
  respiratoryRate?: string;
  heartRate?: string;
  temperature?: string;
  oxygenSaturation?: string;
  glucose?: string;
  painLevel?: number;
  hasAllergy?: boolean;
  allergyType?: string;
  allergyDescription?: string;
  allergySeverity?: string;
  vaccines: Array<{ name: string; status: string }>;
};

export type FinishMedicalInput = {
  assessment: string;
  plan: string;
  procedureCode?: string;
  cidCodes: string[];
  medications: MedicalConductsState["medications"];
  procedures: MedicalConductsState["procedures"];
  observationPrescriptions: MedicalConductsState["observationPrescriptions"];
  exams: MedicalConductsState["exams"];
  orientations: MedicalConductsState["orientations"];
  certificates: MedicalConductsState["certificates"];
  declarations: MedicalConductsState["declarations"];
  recipes: MedicalConductsState["recipes"];
  notifications?: string;
  accidentMoto?: boolean;
  accidentCarro?: boolean;
  accidentBicicleta?: boolean;
  accidentPedestre?: boolean;
  accidentOutros?: boolean;
  notes?: string;
  professionalName?: string;
};

function demoRiskToApi(risk: string | null): RiskClassification | null {
  if (!risk) return null;

  switch (risk) {
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
    default:
      return null;
  }
}

const riskMap = {
  EMERGENCIA: "EMERGÊNCIA",
  MUITO_URGENTE: "MUITO URGENTE",
  URGENTE: "URGENTE",
  POUCO_URGENTE: "POUCO URGENTE",
  NAO_URGENTE: "NÃO URGENTE",
} as const;

function mapDemoRow(patientId: string): AmbulatoryAttendanceResponse {
  const queueRow = getDemoQueue().find((item) => item.patientId === patientId);
  const patient = getDemoPatient(patientId);
  const triage = getTriageByPatientId(patientId);

  return {
    id: Number(patientId),
    patientId: Number(patientId),
    patientName: patient?.fullName || "Paciente",
    patientCpf: patient?.cpf || "",
    patientCns: patient?.cns || "",
    patientPhone: patient?.phone || "",
    patientAge: patient?.age || null,
    queueName: queueRow?.queue || "ACOLHIMENTO",
    status:
      queueRow?.status === "AGUARDANDO TRIAGEM"
        ? "AGUARDANDO_TRIAGEM"
        : queueRow?.status === "EM TRIAGEM"
          ? "EM_TRIAGEM"
          : queueRow?.status === "AGUARDANDO MÉDICO"
            ? "AGUARDANDO_MEDICO"
            : queueRow?.status === "EM ATENDIMENTO MÉDICO"
              ? "EM_ATENDIMENTO_MEDICO"
              : "FINALIZADO",
    riskClassification: demoRiskToApi(queueRow?.classification || null),
    priority:
      queueRow?.priority === "Alta" ? "ALTA" : queueRow?.priority === "Crítica" ? "CRITICA" : "NORMAL",
    waitingSince: new Date().toISOString(),
    triageStartedAt: triage?.triageStartedAt || null,
    triageCompletedAt: triage?.triageCompletedAt || (triage?.risk ? new Date().toISOString() : null),
    medicalStartedAt: null,
    medicalCompletedAt: null,
    triageId: triage ? Number(patientId) : null,
    medicalAttendanceId: null,
    observations: triage?.observations || "",
    destination: triage?.destination || "Atendimento Médico",
    weightKg: triage?.weightKg || "",
    heightCm: triage?.heightCm || "",
    bmi: triage?.bmi || "",
    abdominalCircumference: triage?.abdominalCircumference || "",
    bloodPressure: triage?.bloodPressure || "",
    respiratoryRate: triage?.respiratoryRate || "",
    heartRate: triage?.heartRate || "",
    temperature: triage?.temperature || "",
    oxygenSaturation: triage?.oxygenSaturation || "",
    glucose: triage?.glucose || "",
    painLevel: triage?.painLevel ? Number(triage.painLevel) : null,
    hasAllergy: triage?.hasAllergy || false,
    allergyType: triage?.allergyType || null,
    allergyDescription: triage?.allergyDescription || null,
    allergySeverity: triage?.allergySeverity || null,
    vaccines: (triage?.vaccines || []).map((vaccine) => ({ name: vaccine.name, status: vaccine.status })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getAmbulatoryQueue(options: ServiceOptions = {}) {
  if (options.demo) {
    return getQueueWithPatients().map((item) => mapDemoRow(item.patientId));
  }

  return apiRequest<AmbulatoryAttendanceResponse[]>("/api/ambulatory/queue");
}

export async function getAmbulatoryAttendance(attendanceId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    return mapDemoRow(String(attendanceId));
  }

  return apiRequest<AmbulatoryAttendanceResponse>(`/api/ambulatory/queue/${attendanceId}`);
}

export async function createAmbulatoryAttendance(input: CreateAmbulatoryAttendanceInput, options: ServiceOptions = {}) {
  if (options.demo) {
    upsertDemoQueueItem({
      patientId: String(input.patientId),
      queue: input.queueName || "ACOLHIMENTO",
      classification: null,
      status: (input.queueName || "ACOLHIMENTO") === "ATENDIMENTO MÉDICO" ? "AGUARDANDO MÉDICO" : "AGUARDANDO TRIAGEM",
      priority: input.priority === "ALTA" ? "Alta" : input.priority === "CRITICA" ? "Crítica" : "Normal",
    });

    return {
      ...mapDemoRow(String(input.patientId)),
      id: input.patientId,
      patientId: input.patientId,
      patientName: input.patientName,
      patientCpf: input.patientCpf,
      patientCns: input.patientCns || "",
      patientPhone: input.patientPhone || "",
      patientAge: input.patientAge || null,
      queueName: input.queueName || "ACOLHIMENTO",
      priority: input.priority || "NORMAL",
      status: (input.queueName || "ACOLHIMENTO") === "ATENDIMENTO MÉDICO" ? "AGUARDANDO_MEDICO" : "AGUARDANDO_TRIAGEM",
    } satisfies AmbulatoryAttendanceResponse;
  }

  return apiRequest<AmbulatoryAttendanceResponse>("/api/ambulatory/queue", {
    method: "POST",
    body: input,
  });
}

export async function callTriage(attendanceId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    return {
      ...mapDemoRow(String(attendanceId)),
      status: "EM_TRIAGEM" as AmbulatoryStatus,
    };
  }

  return apiRequest<AmbulatoryAttendanceResponse>(`/api/ambulatory/queue/${attendanceId}/call-triage`, {
    method: "PATCH",
  });
}

export async function completeTriage(
  attendanceId: number | string,
  input: CompleteTriageInput,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    const patientId = String(attendanceId);
    const currentTriage = getTriageByPatientId(patientId);

    upsertDemoTriage(patientId, {
      patientId,
      observations: input.observations || "",
      destination: input.destination,
      risk: riskMap[input.riskClassification],
      triageStartedAt: currentTriage?.triageStartedAt || new Date().toISOString(),
      triageCompletedAt: new Date().toISOString(),
      weightKg: input.weightKg || "",
      heightCm: input.heightCm || "",
      bmi: input.bmi || "",
      abdominalCircumference: input.abdominalCircumference || "",
      bloodPressure: input.bloodPressure || "",
      respiratoryRate: input.respiratoryRate || "",
      heartRate: input.heartRate || "",
      temperature: input.temperature || "",
      oxygenSaturation: input.oxygenSaturation || "",
      glucose: input.glucose || "",
      painLevel: input.painLevel ? String(input.painLevel) : "",
      hasAllergy: Boolean(input.hasAllergy),
      allergyType: input.allergyType || currentTriage?.allergyType || "Medicamento",
      allergyDescription: input.allergyDescription || "",
      allergySeverity: input.allergySeverity || currentTriage?.allergySeverity || "Moderada",
      vaccines: input.vaccines.map((vaccine) => ({
        name: vaccine.name,
        status:
          vaccine.status === "Em dia"
            ? "Em dia"
            : vaccine.status === "Pendente"
              ? "Pendente"
              : "Desconhecido",
      })),
    });

    return {
      ...mapDemoRow(patientId),
      ...input,
      status: "AGUARDANDO_MEDICO" as AmbulatoryStatus,
      queueName: "ATENDIMENTO MÉDICO",
    };
  }

  return apiRequest<AmbulatoryAttendanceResponse>(`/api/ambulatory/queue/${attendanceId}/complete-triage`, {
    method: "PATCH",
    body: input,
  });
}

export async function callMedical(attendanceId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    return {
      ...mapDemoRow(String(attendanceId)),
      status: "EM_ATENDIMENTO_MEDICO" as AmbulatoryStatus,
    };
  }

  return apiRequest<AmbulatoryAttendanceResponse>(`/api/ambulatory/queue/${attendanceId}/call-medical`, {
    method: "PATCH",
  });
}

export async function finishMedical(
  attendanceId: number | string,
  input: FinishMedicalInput,
  options: ServiceOptions = {}
) {
  if (options.demo) {
    const patientId = String(attendanceId);
    const currentMedical = getDemoMedical(patientId);

    if (currentMedical) {
      upsertDemoMedical(patientId, {
        ...currentMedical,
        evaluation: input.assessment,
        plan: input.plan,
        procedureCode: input.procedureCode || "",
        selectedCid: input.cidCodes,
        notificationsLabel: input.notifications || "Sem notificações adicionais.",
        accidentReasons: [
          input.accidentMoto ? "Moto" : null,
          input.accidentCarro ? "Carro" : null,
          input.accidentBicicleta ? "Bicicleta" : null,
          input.accidentPedestre ? "Pedestre" : null,
          input.accidentOutros ? "Outros" : null,
        ].filter(Boolean) as string[],
        conducts: {
          medications: input.medications,
          procedures: input.procedures,
          observationPrescriptions: input.observationPrescriptions,
          exams: input.exams,
          orientations: input.orientations,
          certificates: input.certificates,
          declarations: input.declarations,
          recipes: input.recipes,
        },
      });
    }

    return {
      ...mapDemoRow(patientId),
      status: "FINALIZADO" as AmbulatoryStatus,
      queueName: "FINALIZADO",
    };
  }

  return apiRequest<AmbulatoryAttendanceResponse>(`/api/ambulatory/queue/${attendanceId}/finish-medical`, {
    method: "PATCH",
    body: input,
  });
}

export function riskClassificationToLabel(risk?: RiskClassification | null) {
  if (!risk) {
    return null;
  }

  return riskMap[risk];
}
