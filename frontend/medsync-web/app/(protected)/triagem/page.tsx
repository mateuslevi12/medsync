"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, parseApiError } from "../../../lib/api";
import { triagePriorityLabel, triageStatusLabel } from "../../../lib/labels";
import type { PatientResponse, TriagePriority, TriageResponse, TriageStatus } from "../../../lib/types";

interface CreateTriageForm {
  patientId: number;
  patientNameSnapshot: string;
  symptoms: string;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  painLevel: number;
  priority?: TriagePriority;
  notes: string;
}

const EMPTY_FORM: CreateTriageForm = {
  patientId: 0,
  patientNameSnapshot: "",
  symptoms: "",
  bloodPressure: "",
  heartRate: 80,
  respiratoryRate: 16,
  temperature: 36.5,
  oxygenSaturation: 98,
  painLevel: 0,
  notes: ""
};

const STATUS_OPTIONS: TriageStatus[] = ["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function TriagemPage() {
  const [waiting, setWaiting] = useState<TriageResponse[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [form, setForm] = useState<CreateTriageForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; isError: boolean }>({ message: "", isError: false });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [waitingData, patientsData] = await Promise.all([
        apiRequest<TriageResponse[]>("/api/triage/waiting"),
        apiRequest<PatientResponse[]>("/api/patients")
      ]);

      setWaiting(Array.isArray(waitingData) ? waitingData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setStatus({ message: "Fila de triagem carregada.", isError: false });
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  function onPatientChange(rawId: string) {
    const patientId = Number(rawId);
    const patient = patients.find((item) => item.id === patientId);
    setForm((previous) => ({
      ...previous,
      patientId,
      patientNameSnapshot: patient?.fullName || ""
    }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await apiRequest<TriageResponse>("/api/triage", {
        method: "POST",
        body: {
          ...form,
          notes: form.notes.trim() || null,
          priority: form.priority || null
        }
      });

      setForm(EMPTY_FORM);
      setStatus({ message: "Triagem criada com sucesso.", isError: false });
      await loadData();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function updateStatus(id: number, triageStatus: TriageStatus) {
    try {
      await apiRequest<TriageResponse>(`/api/triage/${id}/status`, {
        method: "PATCH",
        body: { status: triageStatus }
      });
      setStatus({ message: "Status da triagem atualizado.", isError: false });
      await loadData();
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  return (
    <main className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Triagem</h1>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-70"
        >
          Atualizar
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Nova triagem</h2>
        <form onSubmit={handleCreate} className="mt-3 grid gap-2 md:grid-cols-2">
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            value={form.patientId || ""}
            onChange={(event) => onPatientChange(event.target.value)}
            required
          >
            <option value="">Selecione o paciente</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName} ({patient.documentNumber})
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            placeholder="Pressão arterial (ex: 12x8)"
            value={form.bloodPressure}
            onChange={(event) => setForm({ ...form, bloodPressure: event.target.value })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            placeholder="Frequência cardíaca"
            value={form.heartRate}
            onChange={(event) => setForm({ ...form, heartRate: Number(event.target.value) })}
            min={20}
            max={250}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            placeholder="Frequência respiratória"
            value={form.respiratoryRate}
            onChange={(event) => setForm({ ...form, respiratoryRate: Number(event.target.value) })}
            min={5}
            max={80}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            step="0.1"
            placeholder="Temperatura"
            value={form.temperature}
            onChange={(event) => setForm({ ...form, temperature: Number(event.target.value) })}
            min={30}
            max={45}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            placeholder="Saturação O2"
            value={form.oxygenSaturation}
            onChange={(event) => setForm({ ...form, oxygenSaturation: Number(event.target.value) })}
            min={50}
            max={100}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            placeholder="Nível de dor (0-10)"
            value={form.painLevel}
            onChange={(event) => setForm({ ...form, painLevel: Number(event.target.value) })}
            min={0}
            max={10}
            required
          />
          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            value={form.priority || ""}
            onChange={(event) =>
              setForm({ ...form, priority: (event.target.value || undefined) as TriagePriority | undefined })
            }
          >
            <option value="">Prioridade automática</option>
            <option value="RED">{triagePriorityLabel("RED")}</option>
            <option value="ORANGE">{triagePriorityLabel("ORANGE")}</option>
            <option value="YELLOW">{triagePriorityLabel("YELLOW")}</option>
            <option value="GREEN">{triagePriorityLabel("GREEN")}</option>
            <option value="BLUE">{triagePriorityLabel("BLUE")}</option>
          </select>
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            placeholder="Sintomas"
            value={form.symptoms}
            onChange={(event) => setForm({ ...form, symptoms: event.target.value })}
            required
          />
          <textarea
            className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            placeholder="Observações (opcional)"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
          <button
            type="submit"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 md:col-span-2"
          >
            Registrar triagem
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Triagens em espera</h2>
        {status.message ? (
          <p className={`mt-2 text-sm font-medium ${status.isError ? "text-red-700" : "text-emerald-700"}`}>
            {status.message}
          </p>
        ) : null}

        <div className="mt-3 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Paciente</th>
                <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Prioridade</th>
                <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Status</th>
                <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((triage) => (
                <tr key={triage.id}>
                  <td className="border border-slate-200 px-3 py-2 text-sm">{triage.patientNameSnapshot}</td>
                  <td className="border border-slate-200 px-3 py-2 text-sm">{triagePriorityLabel(triage.priority)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-sm">{triageStatusLabel(triage.status)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/triagem/${triage.id}`}
                        className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
                      >
                        Detalhes
                      </Link>
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={option === triage.status}
                          onClick={() => void updateStatus(triage.id, option)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {triageStatusLabel(option)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
