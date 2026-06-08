import { apiRequest } from "@/lib/api";
import { demoNotifications, getMedicalByPatientId, getPatientById as getDemoPatient, getTimelineByPatientId, getTriageByPatientId } from "@/lib/medsync-demo";
import type {
  AmbulatoryAttendanceResponse,
  MedicalAttendanceResponse,
  MedicalRecordResponse,
  MedicalRecordSummaryResponse,
  PatientTimelineEventResponse,
} from "@/lib/types";
import { getPatientAllergies, getPatientVaccines } from "@/services/patients";
import { riskLabelToClassification } from "@/services/triage";

type ServiceOptions = {
  demo?: boolean;
};

function parseDemoDate(value?: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  const [, day, month, year, hours = "00", minutes = "00", seconds = "00"] = match;
  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`).toISOString();
}

function buildDemoTriage(patientId: string): AmbulatoryAttendanceResponse[] {
  const patient = getDemoPatient(patientId);
  const triage = getTriageByPatientId(patientId);

  if (!patient || !triage) {
    return [];
  }

  const currentTriage = {
    id: Number(patientId),
    patientId: Number(patientId),
    patientName: patient.fullName,
    patientCpf: patient.cpf,
    patientCns: patient.cns,
    patientPhone: patient.phone,
    patientAge: patient.age,
    queueName: "ATENDIMENTO MÉDICO",
    status: triage.risk ? "AGUARDANDO_MEDICO" : "AGUARDANDO_TRIAGEM",
    riskClassification: triage.risk ? riskLabelToClassification(triage.risk) : null,
    priority: triage.risk === "URGENTE" ? "ALTA" : "NORMAL",
    waitingSince: triage.triageStartedAt || new Date().toISOString(),
    triageStartedAt: triage.triageStartedAt || new Date().toISOString(),
    triageCompletedAt: triage.triageCompletedAt || (triage.risk ? new Date().toISOString() : null),
    medicalStartedAt: null,
    medicalCompletedAt: null,
    triageId: Number(patientId),
    medicalAttendanceId: null,
    observations: triage.observations,
    destination: triage.destination,
    weightKg: triage.weightKg,
    heightCm: triage.heightCm,
    bmi: triage.bmi,
    abdominalCircumference: triage.abdominalCircumference,
    bloodPressure: triage.bloodPressure,
    respiratoryRate: triage.respiratoryRate,
    heartRate: triage.heartRate,
    temperature: triage.temperature,
    oxygenSaturation: triage.oxygenSaturation,
    glucose: triage.glucose,
    painLevel: triage.painLevel ? Number(triage.painLevel) : null,
    hasAllergy: triage.hasAllergy,
    allergyType: triage.allergyType,
    allergyDescription: triage.allergyDescription,
    allergySeverity: triage.allergySeverity,
    vaccines: triage.vaccines.map((vaccine) => ({ name: vaccine.name, status: vaccine.status })),
    createdAt: triage.triageCompletedAt || triage.triageStartedAt || new Date().toISOString(),
    updatedAt: triage.triageCompletedAt || triage.triageStartedAt || new Date().toISOString(),
  } satisfies AmbulatoryAttendanceResponse;

  if (patientId !== "1") {
    return [currentTriage];
  }

  return [
    currentTriage,
    {
      ...currentTriage,
      id: Number(`${patientId}01`),
      triageId: Number(`${patientId}01`),
      riskClassification: "POUCO_URGENTE",
      priority: "NORMAL",
      waitingSince: "2026-05-08T18:20:49.000Z",
      triageStartedAt: "2026-05-08T18:32:00.000Z",
      triageCompletedAt: "2026-05-08T18:45:49.000Z",
      observations: "Consulta de rotina. Sem queixas relevantes.",
      destination: "Atendimento Médico",
      weightKg: "68",
      heightCm: "172",
      bmi: "23,0",
      abdominalCircumference: "74",
      bloodPressure: "120/80",
      respiratoryRate: "16",
      heartRate: "74",
      temperature: "36,5",
      oxygenSaturation: "98",
      glucose: "96",
      painLevel: 0,
      createdAt: "2026-05-08T18:45:49.000Z",
      updatedAt: "2026-05-08T18:45:49.000Z",
    },
  ];
}

function buildDemoMedical(patientId: string): MedicalAttendanceResponse[] {
  const patient = getDemoPatient(patientId);
  const medical = getMedicalByPatientId(patientId);

  if (!patient || !medical) {
    return [];
  }

  const conducts = medical.conducts || {
    medications: [],
    procedures: [],
    observationPrescriptions: [],
    exams: [],
    orientations: [],
    certificates: [],
    declarations: [],
    recipes: [],
  };

  const currentMedical = {
    id: Number(patientId),
    attendanceId: Number(patientId),
    patientId: Number(patientId),
    patientName: patient.fullName,
    assessment: medical.evaluation,
    plan: medical.plan,
    procedureCode: medical.procedureCode,
    cidCodes: medical.selectedCid,
    medications: conducts.medications,
    procedures: conducts.procedures,
    observationPrescriptions: conducts.observationPrescriptions,
    exams: conducts.exams,
    orientations: conducts.orientations,
    certificates: conducts.certificates,
    declarations: conducts.declarations,
    recipes: conducts.recipes,
    notifications: medical.notificationsLabel,
    accidentMoto: medical.accidentReasons.includes("Moto"),
    accidentCarro: medical.accidentReasons.includes("Carro"),
    accidentBicicleta: medical.accidentReasons.includes("Bicicleta"),
    accidentPedestre: medical.accidentReasons.includes("Pedestre"),
    accidentOutros: medical.accidentReasons.includes("Outros"),
    notes: null,
    professionalName: "Equipe médica",
    createdAt: "2026-06-07T19:45:49.000Z",
    completedAt: "2026-06-07T20:15:49.000Z",
  } satisfies MedicalAttendanceResponse;

  if (patientId !== "1") {
    return medical.evaluation ? [currentMedical] : [];
  }

  return [
    currentMedical,
    {
      ...currentMedical,
      id: Number(`${patientId}01`),
      attendanceId: Number(`${patientId}01`),
      assessment: "Consulta de rotina. Paciente eutrófico, sem queixas. Exame físico normal.",
      plan: "Manter hábitos saudáveis. Retorno em 6 meses.",
      procedureCode: "0301060096",
      cidCodes: ["Z00.0"],
      medications: [],
      procedures: [],
      observationPrescriptions: [],
      exams: [
        {
          id: "exam-legacy-1",
          examName: "Perfil lipídico",
          protocol: "",
          observations: "",
          status: "SOLICITADO" as const,
          createdAt: "2026-05-08T19:46:10.000Z",
        },
        {
          id: "exam-legacy-2",
          examName: "Hemograma de rotina",
          protocol: "",
          observations: "",
          status: "SOLICITADO" as const,
          createdAt: "2026-05-08T19:46:40.000Z",
        },
      ],
      orientations: [],
      certificates: [],
      declarations: [],
      recipes: [],
      createdAt: "2026-05-08T19:45:49.000Z",
      completedAt: "2026-05-08T20:00:49.000Z",
    },
  ].filter((item) => item.assessment.trim());
}

function buildDemoTimeline(patientId: string): PatientTimelineEventResponse[] {
  return getTimelineByPatientId(patientId).map((event, index) => ({
    id: index + 1,
    patientId: Number(patientId),
    attendanceId: Number(patientId),
    type: event.type || "PACIENTE_INCLUIDO_FILA",
    title: event.title,
    description: event.description || null,
    createdAt: parseDemoDate(event.date),
  }));
}

function buildDemoSummary(): MedicalRecordSummaryResponse {
  return {
    totalRecords: 3,
    medicalAttendancesToday: 1,
    triagesRegistered: 2,
    patientsWithAllergies: 2,
    patientsWithPendingVaccines: 2,
    latestUpdates: demoNotifications.map((notification, index) => ({
      patientId: index === 0 ? 1 : 2,
      patientName: index === 0 ? "ABDA BARBOZA DOS SANTOS" : "PACIENTE TESTE",
      attendanceId: index === 0 ? 1 : 2,
      type: index === 0 ? "PACIENTE_INCLUIDO_FILA" : "ENCAMINHADO_MEDICO",
      title: notification.title,
      sourceService: "demo",
      createdAt: new Date().toISOString(),
    })),
  };
}

export async function getMedicalRecord(patientId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    const patient = getDemoPatient(String(patientId));
    const triage = patient ? getTriageByPatientId(patient.id) : null;

    if (!patient) {
      return null;
    }

    return {
      patientId: Number(patient.id),
      patientName: patient.fullName,
      patientCpf: patient.cpf,
      patientCns: patient.cns,
      patientAge: patient.age,
      patientPhone: patient.phone,
      allergiesSnapshot: triage?.hasAllergy
        ? [
            {
              type: triage.allergyType,
              description: triage.allergyDescription,
              severity: triage.allergySeverity,
              createdAt: triage.triageCompletedAt || triage.triageStartedAt || new Date().toISOString(),
            },
          ]
        : [],
      vaccinesSnapshot: triage?.vaccines?.map((vaccine) => ({
        name: vaccine.name,
        status: vaccine.status === "Em dia" ? "EM_DIA" : vaccine.status === "Pendente" ? "PENDENTE" : "DESCONHECIDO",
        applicationDate: null,
        notes: null,
      })),
      triages: buildDemoTriage(patient.id),
      medicalAttendances: buildDemoMedical(patient.id),
      timeline: buildDemoTimeline(patient.id),
    } satisfies MedicalRecordResponse;
  }

  return apiRequest<MedicalRecordResponse>(`/api/medical-records/patient/${patientId}`);
}

export async function getPatientTimeline(patientId: number | string, options: ServiceOptions = {}) {
  if (options.demo) {
    return buildDemoTimeline(String(patientId));
  }

  return apiRequest<PatientTimelineEventResponse[]>(`/api/medical-records/patient/${patientId}/timeline`);
}

export async function getMedicalRecordSummary(options: ServiceOptions = {}) {
  if (options.demo) {
    return buildDemoSummary();
  }

  return apiRequest<MedicalRecordSummaryResponse>("/api/medical-records/summary");
}

export async function getClinicalSummary(patientId: number | string, options: ServiceOptions = {}) {
  const [record, allergies, vaccines] = await Promise.all([
    getMedicalRecord(patientId, options),
    getPatientAllergies(patientId, options),
    getPatientVaccines(patientId, options),
  ]);

  return { record, allergies, vaccines };
}
