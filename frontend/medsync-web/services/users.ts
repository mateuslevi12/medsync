import { apiRequest } from "@/lib/api";
import { getStoredUser } from "@/lib/session";
import type { Role, UserResponse } from "@/lib/types";

type ServiceOptions = {
  demo?: boolean;
};

export type CreateUserInput = {
  name: string;
  cpf: string;
  email: string;
  password: string;
  active: boolean;
  role: Role;
};

export type UpdateUserInput = {
  name: string;
  cpf: string;
  email: string;
  password?: string;
  active: boolean;
  role: Role;
};

const DEMO_USERS_STORAGE_KEY = "medsync.demo.users.v1";

const demoUsersSeed: UserResponse[] = [
  {
    id: 1,
    name: "Admin Sistema",
    cpf: "00000000000",
    email: "admin@medsync.com",
    role: "ADMIN",
    active: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-06-08T09:00:00.000Z"
  },
  {
    id: 2,
    name: "Marta Lima",
    cpf: "12345678901",
    email: "marta@medsync.com",
    role: "RECEPTIONIST",
    active: true,
    lastLoginAt: null,
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-06-05T10:00:00.000Z"
  },
  {
    id: 3,
    name: "Carlos Souza",
    cpf: "23456789012",
    email: "carlos@medsync.com",
    role: "NURSE",
    active: true,
    lastLoginAt: null,
    createdAt: "2026-02-12T08:30:00.000Z",
    updatedAt: "2026-06-06T12:00:00.000Z"
  },
  {
    id: 4,
    name: "Ana Ribeiro",
    cpf: "34567890123",
    email: "ana@medsync.com",
    role: "DOCTOR",
    active: true,
    lastLoginAt: null,
    createdAt: "2026-03-07T11:00:00.000Z",
    updatedAt: "2026-06-07T15:00:00.000Z"
  }
];

type RequestLikeError = Error & {
  status?: number;
  statusText?: string;
  path?: string;
  data?: {
    message?: string;
    details?: string[];
  };
};

function createRequestLikeError(message: string, status: number, path: string): never {
  const error = new Error(message) as RequestLikeError;
  error.status = status;
  error.statusText = status === 403 ? "Forbidden" : status === 409 ? "Conflict" : "Bad Request";
  error.path = path;
  error.data = { message, details: [] };
  throw error;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeStoredUser(user: Partial<UserResponse>, fallbackIndex: number): UserResponse {
  const fallback = demoUsersSeed[fallbackIndex] || demoUsersSeed[0];

  return {
    id: typeof user.id === "number" ? user.id : fallback.id,
    name: typeof user.name === "string" ? user.name : fallback.name,
    cpf: typeof user.cpf === "string" && user.cpf.trim() ? user.cpf : fallback.cpf,
    email: typeof user.email === "string" ? user.email : fallback.email,
    role: (user.role as Role) || fallback.role,
    active: typeof user.active === "boolean" ? user.active : fallback.active,
    lastLoginAt: user.lastLoginAt ?? fallback.lastLoginAt ?? null,
    createdAt: user.createdAt || fallback.createdAt,
    updatedAt: user.updatedAt || fallback.updatedAt,
  };
}

function readDemoUsers(): UserResponse[] {
  if (!canUseLocalStorage()) {
    return demoUsersSeed;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_USERS_STORAGE_KEY);
    if (!raw) {
      return demoUsersSeed;
    }

    const parsed = JSON.parse(raw) as Array<Partial<UserResponse>>;
    return parsed.map((user, index) => normalizeStoredUser(user, index));
  } catch {
    return demoUsersSeed;
  }
}

function writeDemoUsers(users: UserResponse[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify(users));
}

function assertAdminGuard(users: UserResponse[], targetUser: UserResponse, nextRole: Role, nextActive: boolean) {
  const isCurrentActiveAdmin = targetUser.role === "ADMIN" && targetUser.active;
  const remainsActiveAdmin = nextRole === "ADMIN" && nextActive;

  if (!isCurrentActiveAdmin || remainsActiveAdmin) {
    return;
  }

  const activeAdmins = users.filter((user) => user.role === "ADMIN" && user.active).length;
  if (activeAdmins <= 1) {
    createRequestLikeError("Não é permitido deixar o sistema sem nenhum administrador ativo.", 403, "/api/users");
  }
}

function assertOwnAccountGuard(targetUser: UserResponse, nextActive: boolean) {
  const currentUser = getStoredUser();
  if (!currentUser || nextActive || currentUser.id !== targetUser.id) {
    return;
  }

  createRequestLikeError("Você não pode inativar ou remover a própria conta.", 403, "/api/users");
}

export async function getUsers(options: ServiceOptions = {}) {
  if (options.demo) {
    return readDemoUsers().sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  }

  return apiRequest<UserResponse[]>("/api/users");
}

export async function createUser(input: CreateUserInput, options: ServiceOptions = {}) {
  if (options.demo) {
    const users = readDemoUsers();
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedCpf = input.cpf.replace(/\D/g, "");
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      createRequestLikeError("E-mail já cadastrado", 409, "/api/users");
    }
    if (users.some((user) => user.cpf === normalizedCpf)) {
      createRequestLikeError("CPF já cadastrado", 409, "/api/users");
    }

    const createdUser: UserResponse = {
      id: users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1,
      name: input.name.trim(),
      cpf: normalizedCpf,
      email: normalizedEmail,
      role: input.role,
      active: input.active,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writeDemoUsers([...users, createdUser]);
    return createdUser;
  }

  return apiRequest<UserResponse>("/api/users", {
    method: "POST",
    body: input
  });
}

export async function updateUser(userId: number, input: UpdateUserInput, options: ServiceOptions = {}) {
  if (options.demo) {
    const users = readDemoUsers();
    const targetUser = users.find((user) => user.id === userId);

    if (!targetUser) {
      createRequestLikeError("Usuário não encontrado", 404, `/api/users/${userId}`);
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedCpf = input.cpf.replace(/\D/g, "");
    if (users.some((user) => user.id !== userId && user.email.toLowerCase() === normalizedEmail)) {
      createRequestLikeError("E-mail já cadastrado", 409, `/api/users/${userId}`);
    }
    if (users.some((user) => user.id !== userId && user.cpf === normalizedCpf)) {
      createRequestLikeError("CPF já cadastrado", 409, `/api/users/${userId}`);
    }

    assertOwnAccountGuard(targetUser, input.active);
    assertAdminGuard(users, targetUser, input.role, input.active);

    const updatedUsers = users.map((user) =>
      user.id === userId
        ? {
            ...user,
            name: input.name.trim(),
            cpf: normalizedCpf,
            email: normalizedEmail,
            role: input.role,
            active: input.active,
            updatedAt: new Date().toISOString()
          }
        : user
    );

    writeDemoUsers(updatedUsers);
    return updatedUsers.find((user) => user.id === userId)!;
  }

  return apiRequest<UserResponse>(`/api/users/${userId}`, {
    method: "PUT",
    body: input
  });
}

export async function updateUserStatus(userId: number, active: boolean, options: ServiceOptions = {}) {
  if (options.demo) {
    const users = readDemoUsers();
    const targetUser = users.find((user) => user.id === userId);

    if (!targetUser) {
      createRequestLikeError("Usuário não encontrado", 404, `/api/users/${userId}/status`);
    }

    assertOwnAccountGuard(targetUser, active);
    assertAdminGuard(users, targetUser, targetUser.role, active);

    const updatedUsers = users.map((user) =>
      user.id === userId
        ? {
            ...user,
            active,
            updatedAt: new Date().toISOString()
          }
        : user
    );

    writeDemoUsers(updatedUsers);
    return updatedUsers.find((user) => user.id === userId)!;
  }

  return apiRequest<UserResponse>(`/api/users/${userId}/status`, {
    method: "PATCH",
    body: { active }
  });
}

export async function deleteUser(userId: number, options: ServiceOptions = {}) {
  if (options.demo) {
    const users = readDemoUsers();
    const targetUser = users.find((user) => user.id === userId);

    if (!targetUser) {
      createRequestLikeError("Usuário não encontrado", 404, `/api/users/${userId}`);
    }

    assertOwnAccountGuard(targetUser, false);
    assertAdminGuard(users, targetUser, targetUser.role, false);
    writeDemoUsers(users.filter((user) => user.id !== userId));
    return;
  }

  await apiRequest<void>(`/api/users/${userId}`, {
    method: "DELETE"
  });
}
