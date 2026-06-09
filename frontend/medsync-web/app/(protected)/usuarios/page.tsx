"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Mail,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserCog,
  UserRound,
  Users
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, StatusPill } from "@/components/medsync-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCpf } from "@/lib/input-masks";
import { getCurrentUser, getPermissionMessage, getRolePermissionSummaries, hasPermission, roleLabel } from "@/lib/rbac";
import { normalizeCpf, sanitizeCpf } from "@/lib/input-sanitizers";
import type { Role, UserResponse } from "@/lib/types";
import { validateCpf } from "@/lib/input-validators";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";
import { createUser, deleteUser, getUsers, updateUser, updateUserStatus } from "@/services/users";

type UserFormState = {
  name: string;
  cpf: string;
  email: string;
  role: Role | "";
  active: "true" | "false";
  password: string;
  confirmPassword: string;
};

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "ADMIN", label: "Administrador" },
  { value: "DOCTOR", label: "Médico" },
  { value: "NURSE", label: "Enfermeiro" },
  { value: "RECEPTIONIST", label: "Recepcionista" }
];

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" }
] as const;

const profileFilterOptions = [
  { value: "all", label: "Todos os perfis" },
  ...roleOptions
] as const;

const initialFormState: UserFormState = {
  name: "",
  cpf: "",
  email: "",
  role: "",
  active: "true",
  password: "",
  confirmPassword: ""
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Não disponível";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsed);
}

function roleTone(role: Role) {
  if (role === "ADMIN") return "blue";
  if (role === "DOCTOR") return "green";
  if (role === "NURSE") return "slate";
  return "red";
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function canMutateUser(user: UserResponse, users: UserResponse[]) {
  const currentUser = getCurrentUser();
  const isSelf = currentUser?.id === user.id;
  const activeAdmins = users.filter((item) => item.role === "ADMIN" && item.active).length;
  const isLastActiveAdmin = user.role === "ADMIN" && user.active && activeAdmins <= 1;

  return {
    isSelf,
    isLastActiveAdmin,
    canToggle: !isSelf && !isLastActiveAdmin,
    canDelete: !isSelf && !isLastActiveAdmin
  };
}

function UsersModal({
  open,
  mode,
  form,
  fieldErrors,
  submitting,
  onClose,
  onChange,
  onSubmit
}: {
  open: boolean;
  mode: "create" | "edit";
  form: UserFormState;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onClose: () => void;
  onChange: (field: keyof UserFormState, value: string) => void;
  onSubmit: () => void;
}) {
  if (!open) {
    return null;
  }

  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="surface-card w-full max-w-2xl rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-[20px] font-bold text-foreground">
              {isCreate ? "Novo usuário" : "Editar usuário"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Preencha os dados de acesso e perfil.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar modal">
            ×
          </Button>
        </div>

        <div className="grid gap-5 px-6 py-5">
          <div className="grid gap-2">
            <label className="field-label">Nome completo</label>
            <Input
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Digite o nome completo"
              maxLength={120}
            />
            {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="field-label">CPF</label>
              <Input
                value={formatCpf(form.cpf)}
                onChange={(event) => onChange("cpf", sanitizeCpf(event.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
              />
              {fieldErrors.cpf ? <p className="text-sm text-destructive">{fieldErrors.cpf}</p> : null}
            </div>

            <div className="grid gap-2">
              <label className="field-label">E-mail</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                placeholder="usuario@medsync.com"
                maxLength={120}
              />
              {fieldErrors.email ? <p className="text-sm text-destructive">{fieldErrors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <label className="field-label">Perfil</label>
              <Select value={form.role} onChange={(event) => onChange("role", event.target.value)}>
                <option value="">Selecione</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {fieldErrors.role ? <p className="text-sm text-destructive">{fieldErrors.role}</p> : null}
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <label className="field-label">Status</label>
            <Select value={form.active} onChange={(event) => onChange("active", event.target.value)}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
            {fieldErrors.active ? <p className="text-sm text-destructive">{fieldErrors.active}</p> : null}
          </div>

          {isCreate ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="field-label">Senha</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => onChange("password", event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  maxLength={72}
                />
                {fieldErrors.password ? <p className="text-sm text-destructive">{fieldErrors.password}</p> : null}
              </div>

              <div className="grid gap-2">
                <label className="field-label">Confirmação de senha</label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => onChange("confirmPassword", event.target.value)}
                  placeholder="Repita a senha"
                  maxLength={72}
                />
                {fieldErrors.confirmPassword ? (
                  <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar usuário"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserDetailsModal({
  open,
  user,
  onClose
}: {
  open: boolean;
  user: UserResponse | null;
  onClose: () => void;
}) {
  if (!open || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="surface-card w-full max-w-xl rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-[20px] font-bold text-foreground">Detalhes do usuário</h2>
            <p className="mt-1 text-sm text-muted-foreground">Informações de acesso e permissões do perfil.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar detalhes">
            ×
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Nome</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{user.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">CPF</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatCpf(user.cpf)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">E-mail</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Perfil</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{roleLabel(user.role)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Status</p>
              <div className="mt-1">
                <StatusPill tone={user.active ? "green" : "red"}>{user.active ? "Ativo" : "Inativo"}</StatusPill>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Criado em</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatDateTime(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Último acesso</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatDateTime(user.lastLoginAt)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-[#F8FAFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Permissões do perfil</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {getRolePermissionSummaries(user.role).map((item) => (
                <li key={item} className="rounded-lg border border-border bg-white px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const canAccess = hasPermission("users.access", getCurrentUser()?.role);
  const canManage = hasPermission("users.manage", getCurrentUser()?.role);
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [profileFilter, setProfileFilter] = useState<(typeof profileFilterOptions)[number]["value"]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]["value"]>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<UserFormState>(initialFormState);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setPageError(null);

      try {
        const data = await getUsers({ demo: forceDemo });
        if (mounted) {
          setUsers(data);
        }
      } catch (error) {
        if (mounted) {
          setPageError(getServiceErrorMessage(error, "Não foi possível carregar os usuários."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [forceDemo]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.cpf.includes(normalizedQuery.replace(/\D/g, "")) ||
        formatCpf(user.cpf).toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      const matchesProfile = profileFilter === "all" || user.role === profileFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.active : !user.active);

      return matchesQuery && matchesProfile && matchesStatus;
    });
  }, [profileFilter, query, statusFilter, users]);

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.active).length,
      inactive: users.filter((user) => !user.active).length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      doctors: users.filter((user) => user.role === "DOCTOR").length,
      nurses: users.filter((user) => user.role === "NURSE").length,
      receptionists: users.filter((user) => user.role === "RECEPTIONIST").length
    }),
    [users]
  );

  function resetForm() {
    setForm(initialFormState);
    setFieldErrors({});
    setEditingUser(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(user: UserResponse) {
    setEditingUser(user);
    setForm({
      name: user.name,
      cpf: user.cpf,
      email: user.email,
      role: user.role,
      active: user.active ? "true" : "false",
      password: "",
      confirmPassword: ""
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  function validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    const normalizedCpf = normalizeCpf(form.cpf);
    const normalizedEmail = normalizeEmail(form.email);
    const isCreate = !editingUser;

    if (!form.name.trim()) {
      errors.name = "Nome obrigatório.";
    }

    if (!normalizedCpf) {
      errors.cpf = "CPF obrigatório.";
    } else {
      const cpfError = validateCpf(normalizedCpf);
      if (cpfError) {
        errors.cpf = cpfError;
      } else if (users.some((user) => user.id !== editingUser?.id && user.cpf === normalizedCpf)) {
        errors.cpf = "Já existe um usuário com este CPF.";
      }
    }

    if (!normalizedEmail) {
      errors.email = "E-mail obrigatório.";
    } else if (!isEmailValid(normalizedEmail)) {
      errors.email = "Informe um e-mail válido.";
    } else if (
      users.some((user) => user.id !== editingUser?.id && user.email.toLowerCase() === normalizedEmail)
    ) {
      errors.email = "Já existe um usuário com este e-mail.";
    }

    if (!form.role) {
      errors.role = "Perfil obrigatório.";
    }

    if (isCreate) {
      if (!form.password.trim()) {
        errors.password = "Senha obrigatória na criação.";
      } else if (form.password.trim().length < 6) {
        errors.password = "A senha deve ter pelo menos 6 caracteres.";
      }

      if (!form.confirmPassword.trim()) {
        errors.confirmPassword = "Confirme a senha.";
      } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = "As senhas não conferem.";
      }
    }

    return errors;
  }

  async function reloadUsers() {
    const data = await getUsers({ demo: forceDemo });
    setUsers(data);
  }

  async function handleSaveUser() {
    const validationErrors = validateForm();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setPageError(null);

    try {
      if (editingUser) {
        await updateUser(
          editingUser.id,
          {
            name: form.name.trim(),
            cpf: normalizeCpf(form.cpf),
            email: normalizeEmail(form.email),
            role: form.role as Role,
            active: form.active === "true",
            password: form.password.trim() || undefined
          },
          { demo: forceDemo }
        );
        setToast("Usuário atualizado com sucesso.");
      } else {
        await createUser(
          {
            name: form.name.trim(),
            cpf: normalizeCpf(form.cpf),
            email: normalizeEmail(form.email),
            role: form.role as Role,
            active: form.active === "true",
            password: form.password.trim()
          },
          { demo: forceDemo }
        );
        setToast("Usuário criado com sucesso.");
      }

      setModalOpen(false);
      resetForm();
      await reloadUsers();
    } catch (error) {
      setPageError(getServiceErrorMessage(error, "Não foi possível salvar o usuário."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(user: UserResponse) {
    try {
      await updateUserStatus(user.id, !user.active, { demo: forceDemo });
      setToast(`Usuário ${!user.active ? "ativado" : "inativado"} com sucesso.`);
      await reloadUsers();
    } catch (error) {
      setPageError(getServiceErrorMessage(error, "Não foi possível atualizar o status do usuário."));
    }
  }

  async function handleDelete(user: UserResponse) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Remover o usuário ${user.name}?`);
      if (!confirmed) {
        return;
      }
    }

    try {
      await deleteUser(user.id, { demo: forceDemo });
      setToast("Usuário removido com sucesso.");
      await reloadUsers();
    } catch (error) {
      setPageError(getServiceErrorMessage(error, "Não foi possível remover o usuário."));
    }
  }

  function clearFilters() {
    setQuery("");
    setProfileFilter("all");
    setStatusFilter("all");
  }

  if (!canAccess) {
    return (
      <AppShell
        title="Usuários"
        description="Gerencie os acessos e permissões da unidade"
        breadcrumbs={[
          { label: "Hub", href: "/dashboard" },
          { label: "Usuários" }
        ]}
      >
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold text-foreground">Acesso restrito</h2>
          <p className="mt-2 text-sm text-muted-foreground">{getPermissionMessage("users.access")}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Usuários"
      description="Gerencie os acessos e permissões da unidade"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Usuários" }
      ]}
      actions={
        canManage ? (
          <Button onClick={openCreateModal}>
            <Plus className="size-4" />
            Novo usuário
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        {toast ? (
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8]">
            {toast}
          </div>
        ) : null}

        {pageError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{pageError}</span>
              {!forceDemo ? (
                <Button variant="outline" size="sm" onClick={() => setForceDemo(true)}>
                  Usar modo demonstração
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <MetricCard label="Total de usuários" value={summary.total} icon={Users} />
          <MetricCard label="Ativos" value={summary.active} icon={ShieldCheck} tone="green" />
          <MetricCard label="Inativos" value={summary.inactive} icon={Power} tone="red" />
          <MetricCard label="Administradores" value={summary.admins} icon={UserCog} tone="blue" />
          <MetricCard label="Médicos" value={summary.doctors} icon={Stethoscope} tone="green" />
          <MetricCard label="Enfermeiros" value={summary.nurses} icon={UserRound} tone="orange" />
          <MetricCard label="Recepcionistas" value={summary.receptionists} icon={Mail} tone="purple" />
        </div>

        <div className="surface-card p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-10"
                placeholder="Buscar por nome, CPF ou e-mail"
              />
            </div>
            <Select
              value={profileFilter}
              onChange={(event) =>
                setProfileFilter(event.target.value as (typeof profileFilterOptions)[number]["value"])
              }
            >
              {profileFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number]["value"])}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </div>

        <div className="table-card overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-head-cell">Nome</th>
                <th className="table-head-cell">E-mail</th>
                <th className="table-head-cell">Perfil</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Último acesso</th>
                <th className="table-head-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-cell text-muted-foreground" colSpan={6}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : null}

              {!loading && filteredUsers.length === 0 ? (
                <tr>
                  <td className="table-cell text-muted-foreground" colSpan={6}>
                    Nenhum usuário encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : null}

              {filteredUsers.map((user) => {
                const guards = canMutateUser(user, users);
                const actionBlockReason = guards.isSelf
                  ? "Você não pode inativar ou remover a própria conta."
                  : guards.isLastActiveAdmin
                    ? "Não é permitido deixar o sistema sem nenhum administrador ativo."
                    : "";

                return (
                  <tr key={user.id}>
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">CPF {formatCpf(user.cpf)} · ID #{user.id}</p>
                      </div>
                    </td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">
                      <StatusPill tone={roleTone(user.role)}>{roleLabel(user.role)}</StatusPill>
                    </td>
                    <td className="table-cell">
                      <StatusPill tone={user.active ? "green" : "red"}>{user.active ? "Ativo" : "Inativo"}</StatusPill>
                    </td>
                    <td className="table-cell">{formatDateTime(user.lastLoginAt)}</td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="size-4" />
                          Detalhes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!guards.canToggle}
                          title={actionBlockReason}
                          onClick={() => void handleToggleStatus(user)}
                        >
                          <Power className="size-4" />
                          {user.active ? "Inativar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!guards.canDelete}
                          title={actionBlockReason}
                          onClick={() => void handleDelete(user)}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">Mostrando {filteredUsers.length} usuário(s).</p>
      </div>

      <UsersModal
        open={modalOpen}
        mode={editingUser ? "edit" : "create"}
        form={form}
        fieldErrors={fieldErrors}
        submitting={submitting}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        onChange={(field, value) =>
          setForm((current) => ({
            ...current,
            [field]: value
          }))
        }
        onSubmit={() => void handleSaveUser()}
      />

      <UserDetailsModal
        open={detailsOpen}
        user={selectedUser}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedUser(null);
        }}
      />
    </AppShell>
  );
}
