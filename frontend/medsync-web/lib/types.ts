export type Role = "ADMIN" | "HEALTH_PROFESSIONAL" | "RECEPTIONIST";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type TriagePriority = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE";
export type TriageStatus = "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type NotificationType =
  | "TRIAGE_CREATED"
  | "TRIAGE_UPDATED"
  | "TRIAGE_PRIORITY_CHANGED"
  | "PATIENT_ADDED_TO_QUEUE"
  | "TRIAGE_STARTED"
  | "TRIAGE_COMPLETED"
  | "PATIENT_REFERRED_TO_MEDICAL"
  | "MEDICAL_STARTED"
  | "MEDICAL_FINISHED";
export type AmbulatoryStatus =
  | "AGUARDANDO_TRIAGEM"
  | "EM_TRIAGEM"
  | "AGUARDANDO_MEDICO"
  | "EM_ATENDIMENTO_MEDICO"
  | "FINALIZADO";
export type AmbulatoryPriority = "NORMAL" | "ALTA" | "CRITICA";
export type RiskClassification =
  | "EMERGENCIA"
  | "MUITO_URGENTE"
  | "URGENTE"
  | "POUCO_URGENTE"
  | "NAO_URGENTE";
export type AllergyType = "MEDICAMENTO" | "ALIMENTO" | "OUTRO";
export type AllergySeverity = "LEVE" | "MODERADA" | "GRAVE";
export type VaccineStatus = "EM_DIA" | "PENDENTE" | "DESCONHECIDO";
export type TimelineEventType =
  | "PACIENTE_INCLUIDO_FILA"
  | "TRIAGEM_INICIADA"
  | "TRIAGEM_FINALIZADA"
  | "ENCAMINHADO_MEDICO"
  | "ATENDIMENTO_MEDICO_INICIADO"
  | "ATENDIMENTO_MEDICO_FINALIZADO"
  | "NOTIFICACAO_GERADA";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientResponse {
  id: number;
  fullName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  documentNumber: string;
  cns?: string | null;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientAllergyResponse {
  id: number;
  patientId: number;
  type: AllergyType;
  description: string;
  severity: AllergySeverity;
  createdAt: string;
}

export interface PatientVaccineResponse {
  id: number;
  patientId: number;
  name: string;
  status: VaccineStatus;
  applicationDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface TriageResponse {
  id: number;
  patientId: number;
  patientNameSnapshot: string;
  symptoms: string;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  painLevel: number;
  priority: TriagePriority;
  status: TriageStatus;
  notes?: string;
  createdByUserId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  sourceEventId: string;
  sourceAggregateId: string;
  createdAt: string;
}

export interface VaccineSnapshot {
  name: string;
  status: string;
  applicationDate?: string | null;
  notes?: string | null;
}

export interface AllergySnapshotResponse {
  type: string;
  description: string;
  severity?: string | null;
  createdAt?: string | null;
}

export interface AmbulatoryAttendanceResponse {
  id: number;
  patientId: number;
  patientName: string;
  patientCpf: string;
  patientCns?: string | null;
  patientPhone?: string | null;
  patientAge?: number | null;
  queueName: string;
  status: AmbulatoryStatus;
  riskClassification?: RiskClassification | null;
  priority: AmbulatoryPriority;
  waitingSince: string;
  triageStartedAt?: string | null;
  triageCompletedAt?: string | null;
  medicalStartedAt?: string | null;
  medicalCompletedAt?: string | null;
  triageId?: number | null;
  medicalAttendanceId?: number | null;
  observations?: string | null;
  destination?: string | null;
  weightKg?: string | null;
  heightCm?: string | null;
  bmi?: string | null;
  abdominalCircumference?: string | null;
  bloodPressure?: string | null;
  respiratoryRate?: string | null;
  heartRate?: string | null;
  temperature?: string | null;
  oxygenSaturation?: string | null;
  glucose?: string | null;
  painLevel?: number | null;
  hasAllergy?: boolean | null;
  allergyType?: string | null;
  allergyDescription?: string | null;
  allergySeverity?: string | null;
  vaccines: VaccineSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalAttendanceResponse {
  id: number;
  attendanceId: number;
  patientId: number;
  patientName: string;
  assessment: string;
  plan: string;
  procedureCode?: string | null;
  cidCodes: string[];
  exams: string[];
  prescriptions: string[];
  notifications?: string | null;
  accidentMoto: boolean;
  accidentCarro: boolean;
  accidentBicicleta: boolean;
  accidentPedestre: boolean;
  accidentOutros: boolean;
  notes?: string | null;
  professionalName?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface PatientTimelineEventResponse {
  id: number;
  patientId: number;
  attendanceId: number;
  type: TimelineEventType;
  title: string;
  description?: string | null;
  createdAt: string;
}

export interface MedicalRecordResponse {
  patientId: number;
  patientName: string;
  patientCpf: string;
  patientCns?: string | null;
  patientAge?: number | null;
  patientPhone?: string | null;
  allergiesSnapshot?: AllergySnapshotResponse[];
  vaccinesSnapshot?: VaccineSnapshot[];
  triages: AmbulatoryAttendanceResponse[];
  medicalAttendances: MedicalAttendanceResponse[];
  timeline: PatientTimelineEventResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LatestMedicalRecordUpdateResponse {
  patientId: number;
  patientName: string;
  attendanceId?: number | null;
  type: TimelineEventType;
  title: string;
  sourceService?: string | null;
  createdAt: string;
}

export interface MedicalRecordSummaryResponse {
  totalRecords: number;
  medicalAttendancesToday: number;
  triagesRegistered: number;
  patientsWithAllergies: number;
  patientsWithPendingVaccines: number;
  latestUpdates: LatestMedicalRecordUpdateResponse[];
}
