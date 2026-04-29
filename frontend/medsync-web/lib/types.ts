export type Role = "ADMIN" | "HEALTH_PROFESSIONAL" | "RECEPTIONIST";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type TriagePriority = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE";
export type TriageStatus = "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type NotificationType = "TRIAGE_CREATED" | "TRIAGE_UPDATED" | "TRIAGE_PRIORITY_CHANGED";

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
  address: string;
  createdAt?: string;
  updatedAt?: string;
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
