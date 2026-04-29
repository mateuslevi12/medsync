"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, parseApiError } from "../../../lib/api";
import { genderLabel } from "../../../lib/labels";
import type { Gender, PatientResponse } from "../../../lib/types";

interface PatientForm {
  fullName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  documentNumber: string;
  address: string;
}

const EMPTY_FORM: PatientForm = {
  fullName: "",
  birthDate: "",
  gender: "MALE",
  phone: "",
  documentNumber: "",
  address: ""
};

export default function FilaEsperaPage() {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [includeOpen, setIncludeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [includeForm, setIncludeForm] = useState<PatientForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<PatientForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState<{ message: string; isError: boolean }>({
    message: "",
    isError: false
  });

  useEffect(() => {
    void loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const data = await apiRequest<PatientResponse[]>("/api/patients");
      setPatients(Array.isArray(data) ? data : []);
      setStatus({ message: "Fila carregada.", isError: false });
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  function toPayload(source: PatientForm) {
    return {
      fullName: source.fullName.trim(),
      birthDate: source.birthDate,
      gender: source.gender,
      phone: source.phone.trim(),
      documentNumber: source.documentNumber.trim(),
      address: source.address.trim()
    };
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
      await apiRequest<PatientResponse>("/api/patients", {
        method: "POST",
        body: toPayload(includeForm)
      });
      setStatus({ message: "Paciente incluído na fila.", isError: false });
      closeIncludeDialog();
      await loadPatients();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    try {
      await apiRequest<PatientResponse>(`/api/patients/${editingId}`, {
        method: "PUT",
        body: toPayload(editForm)
      });
      setStatus({ message: "Paciente atualizado com sucesso.", isError: false });
      cancelEdit();
      await loadPatients();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  function startEdit(patient: PatientResponse) {
    setEditingId(patient.id);
    setEditForm({
      fullName: patient.fullName || "",
      birthDate: patient.birthDate || "",
      gender: patient.gender || "MALE",
      phone: patient.phone || "",
      documentNumber: patient.documentNumber || "",
      address: patient.address || ""
    });
    setEditOpen(true);
  }

  function cancelEdit() {
    setEditOpen(false);
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  async function removePatient(patientId: number) {
    try {
      await apiRequest<void>(`/api/patients/${patientId}`, { method: "DELETE" });
      setStatus({ message: "Paciente removido da fila.", isError: false });

      if (editingId === patientId) {
        cancelEdit();
      }

      await loadPatients();
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
            aria-label="Incluir paciente"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Incluir paciente</h2>
            <PatientFormFields form={includeForm} onChange={setIncludeForm} />
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
            aria-label="Editar paciente"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Editar paciente</h2>
            <form className="mt-3" onSubmit={submitEdit}>
              <PatientFormFields form={editForm} onChange={setEditForm} />
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
          <h1 className="text-2xl font-semibold">Fila de Espera</h1>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openIncludeDialog}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Incluir paciente
            </button>
            <button
              type="button"
              onClick={() => void loadPatients()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Atualizar lista
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Pacientes</h2>

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
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Nascimento</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Telefone</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Documento</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{patient.fullName}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{patient.birthDate}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{patient.phone}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">{patient.documentNumber}</td>
                    <td className="border border-slate-200 px-3 py-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(patient)}
                          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void removePatient(patient.id)}
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

function PatientFormFields({
  form,
  onChange
}: {
  form: PatientForm;
  onChange: (next: PatientForm) => void;
}) {
  return (
    <div className="mt-3 grid gap-2">
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="Nome completo"
        value={form.fullName}
        onChange={(event) => onChange({ ...form, fullName: event.target.value })}
        required
      />
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        type="date"
        value={form.birthDate}
        onChange={(event) => onChange({ ...form, birthDate: event.target.value })}
        required
      />
      <select
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        value={form.gender}
        onChange={(event) => onChange({ ...form, gender: event.target.value as Gender })}
        required
      >
        <option value="MALE">{genderLabel("MALE")}</option>
        <option value="FEMALE">{genderLabel("FEMALE")}</option>
        <option value="OTHER">{genderLabel("OTHER")}</option>
      </select>
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="Telefone"
        value={form.phone}
        onChange={(event) => onChange({ ...form, phone: event.target.value })}
        required
      />
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="CPF/documentNumber"
        value={form.documentNumber}
        onChange={(event) => onChange({ ...form, documentNumber: event.target.value })}
        required
      />
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="Endereço"
        value={form.address}
        onChange={(event) => onChange({ ...form, address: event.target.value })}
        required
      />
    </div>
  );
}
