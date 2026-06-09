import { getStoredUser } from "@/lib/session";
import type { AuthUser, Role } from "@/lib/types";

export type Permission =
  | "users.access"
  | "users.manage"
  | "queue.insert"
  | "queue.callTriage"
  | "queue.callMedical"
  | "triage.edit"
  | "medical.edit"
  | "record.view"
  | "record.print"
  | "conduct.print";

const permissionMatrix: Record<Role, Permission[]> = {
  ADMIN: [
    "users.access",
    "users.manage",
    "queue.insert",
    "queue.callTriage",
    "queue.callMedical",
    "triage.edit",
    "medical.edit",
    "record.view",
    "record.print",
    "conduct.print"
  ],
  RECEPTIONIST: ["queue.insert"],
  NURSE: ["triage.edit", "queue.callTriage", "record.view"],
  DOCTOR: ["medical.edit", "queue.callMedical", "record.view", "record.print", "conduct.print"],
  HEALTH_PROFESSIONAL: [
    "queue.callTriage",
    "queue.callMedical",
    "triage.edit",
    "medical.edit",
    "record.view",
    "record.print",
    "conduct.print"
  ]
};

const permissionMessages: Partial<Record<Permission, string>> = {
  "users.access": "Você não tem permissão para acessar a tela de usuários.",
  "users.manage": "Você não tem permissão para executar esta ação.",
  "queue.insert": "Apenas recepcionistas podem inserir pacientes na fila.",
  "queue.callTriage": "Apenas enfermeiros podem chamar para triagem.",
  "queue.callMedical": "Apenas médicos podem chamar para atendimento médico.",
  "triage.edit": "Você não tem permissão para editar a triagem.",
  "medical.edit": "Você não tem permissão para editar o atendimento médico.",
  "record.print": "Você não tem permissão para imprimir o prontuário.",
  "conduct.print": "Você não tem permissão para imprimir esta conduta."
};

export function roleLabel(role?: Role | null): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "RECEPTIONIST":
      return "Recepcionista";
    case "NURSE":
      return "Enfermeiro";
    case "DOCTOR":
      return "Médico";
    case "HEALTH_PROFESSIONAL":
      return "Profissional de saúde";
    default:
      return "Equipe assistencial";
  }
}

export function getRolePermissions(role?: Role | null): Permission[] {
  if (!role) {
    return [];
  }

  return permissionMatrix[role] || [];
}

export function hasPermission(permission: Permission, role?: Role | null): boolean {
  return getRolePermissions(role).includes(permission);
}

export function getPermissionMessage(permission: Permission): string {
  return permissionMessages[permission] || "Você não tem permissão para executar esta ação.";
}

export function getCurrentUserRole(): Role | null {
  return getStoredUser()?.role || null;
}

export function getCurrentUser(): AuthUser | null {
  return getStoredUser();
}

export function getRolePermissionSummaries(role?: Role | null): string[] {
  switch (role) {
    case "ADMIN":
      return [
        "Acessa todas as funcionalidades do sistema.",
        "Gerencia usuários, perfis, status e permissões.",
        "Pode inserir pacientes na fila, chamar triagem e atendimento médico."
      ];
    case "RECEPTIONIST":
      return [
        "Insere pacientes na fila e acompanha a fila de atendimento.",
        "Visualiza pacientes e dados administrativos.",
        "Não edita triagem, atendimento médico nem prontuário clínico."
      ];
    case "NURSE":
      return [
        "Visualiza a fila e chama pacientes para triagem.",
        "Preenche e finaliza acolhimento/triagem.",
        "Não chama atendimento médico nem altera condutas médicas."
      ];
    case "DOCTOR":
      return [
        "Visualiza a fila e chama pacientes para atendimento médico.",
        "Registra avaliação médica, prescrições, condutas e encaminhamentos.",
        "Pode visualizar e imprimir prontuário e condutas médicas."
      ];
    case "HEALTH_PROFESSIONAL":
      return [
        "Perfil legado com acesso assistencial amplo.",
        "Mantido por compatibilidade até a migração completa de perfis."
      ];
    default:
      return [];
  }
}
