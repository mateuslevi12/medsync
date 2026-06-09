import { roleLabel } from "@/lib/rbac";
import type { Gender, NotificationType, Role, TriagePriority, TriageStatus } from "./types";

export { roleLabel };

export function genderLabel(gender: Gender): string {
  switch (gender) {
    case "MALE":
      return "Masculino";
    case "FEMALE":
      return "Feminino";
    case "OTHER":
      return "Outro";
    default:
      return gender;
  }
}

export function triagePriorityLabel(priority: TriagePriority): string {
  switch (priority) {
    case "RED":
      return "Vermelho";
    case "ORANGE":
      return "Laranja";
    case "YELLOW":
      return "Amarelo";
    case "GREEN":
      return "Verde";
    case "BLUE":
      return "Azul";
    default:
      return priority;
  }
}

export function triageStatusLabel(status: TriageStatus): string {
  switch (status) {
    case "WAITING":
      return "Aguardando";
    case "IN_PROGRESS":
      return "Em atendimento";
    case "COMPLETED":
      return "Concluida";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "TRIAGE_CREATED":
      return "Triagem criada";
    case "TRIAGE_UPDATED":
      return "Triagem atualizada";
    case "TRIAGE_PRIORITY_CHANGED":
      return "Prioridade alterada";
    default:
      return type;
  }
}
