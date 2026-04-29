"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, parseApiError } from "../../../lib/api";
import { roleLabel } from "../../../lib/labels";
import type { Role, UserResponse } from "../../../lib/types";

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const EMPTY_FORM: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "RECEPTIONIST"
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [includeOpen, setIncludeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [includeForm, setIncludeForm] = useState<UserForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<UserForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState<{ message: string; isError: boolean }>({
    message: "",
    isError: false
  });

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await apiRequest<UserResponse[]>("/api/users");
      setUsers(Array.isArray(data) ? data : []);
      setStatus({ message: "Lista de usuários carregada.", isError: false });
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  function openIncludeDialog() {
    setIncludeForm(EMPTY_FORM);
    setIncludeOpen(true);
  }

  function closeIncludeDialog() {
    setIncludeOpen(false);
    setIncludeForm(EMPTY_FORM);
  }

  async function submitInclude(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiRequest<UserResponse>("/api/users", {
        method: "POST",
        body: {
          name: includeForm.name.trim(),
          email: includeForm.email.trim(),
          password: includeForm.password,
          role: includeForm.role
        }
      });
      setStatus({ message: "Usuário incluído com sucesso.", isError: false });
      closeIncludeDialog();
      await loadUsers();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    const payload: {
      name: string;
      email: string;
      role: Role;
      password?: string;
    } = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    try {
      await apiRequest<UserResponse>(`/api/users/${editingId}`, {
        method: "PUT",
        body: payload
      });
      setStatus({ message: "Usuário atualizado com sucesso.", isError: false });
      cancelEdit();
      await loadUsers();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  function startEdit(user: UserResponse) {
    setEditingId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "RECEPTIONIST"
    });
    setEditOpen(true);
  }

  function cancelEdit() {
    setEditOpen(false);
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  async function removeUser(userId: number) {
    try {
      await apiRequest<void>(`/api/users/${userId}`, { method: "DELETE" });
      setStatus({ message: "Usuário removido.", isError: false });

      if (editingId === userId) {
        cancelEdit();
      }

      await loadUsers();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  return (
    <>
      {includeOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          onClick={closeIncludeDialog}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Incluir usuário"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Incluir usuário</h2>
            <UserFormFields form={includeForm} onChange={setIncludeForm} requirePassword />
            <form onSubmit={submitInclude} className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeIncludeDialog}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Incluir
              </button>
            </form>
          </section>
        </div>
      ) : null}
      {editOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          onClick={cancelEdit}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Editar usuário"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Editar usuário</h2>
            <form className="mt-3" onSubmit={submitEdit}>
              <UserFormFields form={editForm} onChange={setEditForm} requirePassword={false} />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Salvar edição
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <main className="grid gap-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Usuários do Sistema</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openIncludeDialog}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Incluir usuário
            </button>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Atualizar lista
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Usuários cadastrados</h2>

          {status.message ? (
            <p className={`mt-2 text-sm font-medium ${status.isError ? "text-red-700" : "text-emerald-700"}`}>
              {status.message}
            </p>
          ) : null}

          <div className="mt-3 overflow-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Nome</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Email</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Perfil</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{user.name}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{user.email}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{roleLabel(user.role)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeUser(user.id)}
                          className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

function UserFormFields({
  form,
  onChange,
  requirePassword
}: {
  form: UserForm;
  onChange: (next: UserForm) => void;
  requirePassword: boolean;
}) {
  return (
    <div className="mt-3 grid gap-2">
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="Nome"
        value={form.name}
        onChange={(event) => onChange({ ...form, name: event.target.value })}
        required
      />
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(event) => onChange({ ...form, email: event.target.value })}
        required
      />
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        type="password"
        placeholder={requirePassword ? "Senha" : "Nova senha (opcional)"}
        value={form.password}
        onChange={(event) => onChange({ ...form, password: event.target.value })}
        minLength={6}
        required={requirePassword}
      />
      <select
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        value={form.role}
        onChange={(event) => onChange({ ...form, role: event.target.value as Role })}
        required
      >
        <option value="ADMIN">{roleLabel("ADMIN")}</option>
        <option value="HEALTH_PROFESSIONAL">{roleLabel("HEALTH_PROFESSIONAL")}</option>
        <option value="RECEPTIONIST">{roleLabel("RECEPTIONIST")}</option>
      </select>
    </div>
  );
}
