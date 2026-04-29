"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, parseApiError } from "../../../../lib/api";
import { triagePriorityLabel, triageStatusLabel } from "../../../../lib/labels";
import type { TriagePriority, TriageResponse, TriageStatus } from "../../../../lib/types";

interface EditForm {
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

export default function TriageDetailsPage() {
  const params = useParams<{ id: string }>();
  const triageId = Number(params?.id || 0);

  const [triage, setTriage] = useState<TriageResponse | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [status, setStatus] = useState<{ message: string; isError: boolean }>({ message: "", isError: false });

  useEffect(() => {
    if (!triageId) return;
    void loadTriage();
  }, [triageId]);

  async function loadTriage() {
    try {
      const response = await apiRequest<TriageResponse>(`/api/triage/${triageId}`);
      setTriage(response);
      setForm({
        symptoms: response.symptoms,
        bloodPressure: response.bloodPressure,
        heartRate: response.heartRate,
        respiratoryRate: response.respiratoryRate,
        temperature: response.temperature,
        oxygenSaturation: response.oxygenSaturation,
        painLevel: response.painLevel,
        priority: response.priority,
        notes: response.notes || ""
      });
      setStatus({ message: "Triagem carregada.", isError: false });
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !triageId) return;

    try {
      const updated = await apiRequest<TriageResponse>(`/api/triage/${triageId}`, {
        method: "PUT",
        body: {
          ...form,
          notes: form.notes.trim() || null,
          priority: form.priority || null
        }
      });
      setTriage(updated);
      setStatus({ message: "Triagem atualizada com sucesso.", isError: false });
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  async function updateStatus(nextStatus: TriageStatus) {
    if (!triageId) return;

    try {
      const updated = await apiRequest<TriageResponse>(`/api/triage/${triageId}/status`, {
        method: "PATCH",
        body: { status: nextStatus }
      });
      setTriage(updated);
      setStatus({ message: "Status atualizado.", isError: false });
    } catch (error) {
      const parsed = parseApiError(error);
      setStatus({ message: parsed.message, isError: true });
    }
  }

  if (!triage || !form) {
    return (
      <main className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-700">Carregando triagem...</p>
        {status.message ? (
          <p className={`mt-2 text-sm font-medium ${status.isError ? "text-red-700" : "text-emerald-700"}`}>
            {status.message}
          </p>
        ) : null}
      </main>
    );
  }

  return (
    <main className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Triagem #{triage.id}</h1>
        <Link
          href="/triagem"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Voltar
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-700">
          Paciente: <strong>{triage.patientNameSnapshot}</strong>
        </p>
        <p className="text-sm text-slate-700">
          Prioridade atual: <strong>{triagePriorityLabel(triage.priority)}</strong>
        </p>
        <p className="text-sm text-slate-700">
          Status atual: <strong>{triageStatusLabel(triage.status)}</strong>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            onClick={() => void updateStatus("WAITING")}
          >
            Aguardando
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            onClick={() => void updateStatus("IN_PROGRESS")}
          >
            Em atendimento
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            onClick={() => void updateStatus("COMPLETED")}
          >
            Concluida
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            onClick={() => void updateStatus("CANCELLED")}
          >
            Cancelada
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Editar triagem</h2>
        <form className="mt-3 grid gap-2 md:grid-cols-2" onSubmit={save}>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            value={form.bloodPressure}
            onChange={(event) => setForm({ ...form, bloodPressure: event.target.value })}
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
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            min={20}
            max={250}
            value={form.heartRate}
            onChange={(event) => setForm({ ...form, heartRate: Number(event.target.value) })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            min={5}
            max={80}
            value={form.respiratoryRate}
            onChange={(event) => setForm({ ...form, respiratoryRate: Number(event.target.value) })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            step="0.1"
            min={30}
            max={45}
            value={form.temperature}
            onChange={(event) => setForm({ ...form, temperature: Number(event.target.value) })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            min={50}
            max={100}
            value={form.oxygenSaturation}
            onChange={(event) => setForm({ ...form, oxygenSaturation: Number(event.target.value) })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="number"
            min={0}
            max={10}
            value={form.painLevel}
            onChange={(event) => setForm({ ...form, painLevel: Number(event.target.value) })}
            required
          />
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            value={form.symptoms}
            onChange={(event) => setForm({ ...form, symptoms: event.target.value })}
            required
          />
          <textarea
            className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
          <button
            type="submit"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 md:col-span-2"
          >
            Salvar
          </button>
        </form>

        {status.message ? (
          <p className={`mt-3 text-sm font-medium ${status.isError ? "text-red-700" : "text-emerald-700"}`}>
            {status.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
