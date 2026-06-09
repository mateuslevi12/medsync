"use client";

import Link from "next/link";
import { FileText, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PatientIntakeModal, type PatientIntakeSubmission } from "@/components/patient-intake-modal";
import { RiskPill, StatusPill } from "@/components/medsync-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mapQueueSearchQuery } from "@/lib/form-mappers";
import { formatCpf } from "@/lib/input-masks";
import { onlyDigits } from "@/lib/input-sanitizers";
import { getCurrentUser, getPermissionMessage, hasPermission } from "@/lib/rbac";
import type { AmbulatoryAttendanceResponse } from "@/lib/types";
import {
  callMedical,
  callTriage,
  createAmbulatoryAttendance,
  getAmbulatoryQueue,
  riskClassificationToLabel,
} from "@/services/ambulatory";
import { createPatient } from "@/services/patients";
import { inferBirthDateFromAge, isDemoModeEnabled, getServiceErrorMessage } from "@/services/runtime";

type IntakePatientSummary = {
  id: number;
  fullName: string;
  documentNumber: string;
  cns: string | null;
  phone: string;
};

export default function FilaAtendimentoPage() {
  const router = useRouter();
  const currentRole = getCurrentUser()?.role;
  const canInsertQueue = hasPermission("queue.insert", currentRole);
  const canCallTriage = hasPermission("queue.callTriage", currentRole);
  const canCallMedical = hasPermission("queue.callMedical", currentRole);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [rowsData, setRowsData] = useState<AmbulatoryAttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [activeRowId, setActiveRowId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setPageError(null);

      try {
        const queue = await getAmbulatoryQueue({ demo: forceDemo });

        if (!mounted) return;
        setRowsData(queue);
      } catch (error) {
        if (!mounted) return;
        setPageError(getServiceErrorMessage(error, "Não foi possível carregar a fila ambulatorial."));
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

  const rows = useMemo(() => {
    const normalized = mapQueueSearchQuery(query).toLowerCase();
    const digitsOnlyQuery = onlyDigits(normalized);
    return rowsData.filter((item) => {
      if (!normalized) return true;
      const patientCpfDigits = onlyDigits(item.patientCpf);
      const patientCnsDigits = onlyDigits(item.patientCns || "");

      return (
        item.patientName.toLowerCase().includes(normalized) ||
        formatCpf(item.patientCpf).toLowerCase().includes(normalized) ||
        (digitsOnlyQuery.length > 0 &&
          (patientCpfDigits.includes(digitsOnlyQuery) || patientCnsDigits.includes(digitsOnlyQuery)))
      );
    });
  }, [query, rowsData]);

  async function reloadQueue() {
    const queue = await getAmbulatoryQueue({ demo: forceDemo });
    setRowsData(queue);
  }

  async function handleQueueAction(row: AmbulatoryAttendanceResponse) {
    if (row.status === "AGUARDANDO_TRIAGEM" && !canCallTriage) {
      setPageError(getPermissionMessage("queue.callTriage"));
      return;
    }

    if (row.status === "AGUARDANDO_MEDICO" && !canCallMedical) {
      setPageError(getPermissionMessage("queue.callMedical"));
      return;
    }

    setActiveRowId(row.id);
    setPageError(null);

    try {
      if (row.status === "AGUARDANDO_TRIAGEM") {
        await callTriage(row.id, { demo: forceDemo });
        router.push(`/acolhimento/${row.id}`);
        return;
      }

      if (row.status === "AGUARDANDO_MEDICO") {
        await callMedical(row.id, { demo: forceDemo });
        router.push(`/atendimento-medico/${row.id}`);
        return;
      }

      router.push(row.status === "EM_TRIAGEM" ? `/acolhimento/${row.id}` : `/atendimento-medico/${row.id}`);
    } catch (error) {
      setPageError(getServiceErrorMessage(error, "Não foi possível atualizar o status do atendimento."));
    } finally {
      setActiveRowId(null);
    }
  }

  async function handleModalSubmit(payload: PatientIntakeSubmission) {
    setModalSubmitting(true);
    setModalError(null);

    try {
      let patientId = payload.selectedPatientId;
      let patient: IntakePatientSummary | null =
        payload.selectedPatientId && payload.selectedPatient
          ? {
              id: payload.selectedPatient.id,
              fullName: payload.selectedPatient.fullName,
              documentNumber: payload.selectedPatient.documentNumber,
              cns: payload.selectedPatient.cns || null,
              phone: payload.selectedPatient.phone || "",
            }
          : null;

      if (payload.entryType === "new") {
        const createdPatient = await createPatient(
          {
            fullName: payload.form.fullName.trim(),
            birthDate: inferBirthDateFromAge(payload.form.age),
            gender: "OTHER",
            phone: payload.form.phone.trim(),
            documentNumber: payload.form.cpf.trim(),
            cns: payload.form.cns.trim(),
            address: "Cadastro rápido via fila de atendimento",
          },
          { demo: forceDemo }
        );

        patientId = createdPatient.id;
        patient = {
          id: createdPatient.id,
          fullName: createdPatient.fullName,
          documentNumber: createdPatient.documentNumber,
          cns: createdPatient.cns || null,
          phone: createdPatient.phone,
        };
      }

      if (!patientId || !patient) {
        throw new Error("Paciente inválido para inclusão na fila.");
      }

      await createAmbulatoryAttendance(
        {
          patientId,
          patientName: patient.fullName,
          patientCpf: patient.documentNumber,
          patientCns: patient.cns || payload.form.cns,
          patientPhone: patient.phone || payload.form.phone,
          patientAge: payload.entryType === "new" ? Number(payload.form.age) || undefined : undefined,
          queueName: payload.destination === "Atendimento Médico" ? "ATENDIMENTO MÉDICO" : "ACOLHIMENTO",
          priority:
            payload.priority === "Crítica" ? "CRITICA" : payload.priority === "Alta" ? "ALTA" : "NORMAL",
        },
        { demo: forceDemo }
      );

      setMessage(
        `Paciente ${patient.fullName} incluído na fila de ${payload.destination.toLowerCase()}.`
      );
      setModalOpen(false);
      await reloadQueue();
    } catch (error) {
      setModalError(getServiceErrorMessage(error, "Não foi possível incluir o paciente na fila."));
    } finally {
      setModalSubmitting(false);
    }
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Hospitalar", href: "/dashboard" },
        { label: "Ambulatorial", href: "/ambulatorial" },
        { label: "Fila de Atendimento" },
      ]}
      actions={
        <>
          <Button variant="outline">
            <SlidersHorizontal className="size-4" />
            Filtros
          </Button>
          <Button variant="outline">Sala</Button>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={!canInsertQueue}
            title={!canInsertQueue ? getPermissionMessage("queue.insert") : undefined}
          >
            <Plus className="size-4" />
            Incluir paciente
          </Button>
        </>
      }
    >
      <div className="surface-card p-5">
        <h1 className="text-[16px] font-bold text-foreground">Fila de espera — HOSPITAL MUNICIPAL MONSENHOR DOURADO</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pacientes em espera de atendimento ambulatorial</p>

        {pageError ? (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(mapQueueSearchQuery(event.target.value))}
            placeholder="Pesquisar por nome ou CPF..."
            className="pl-10"
            maxLength={80}
          />
        </div>

        {message ? <p className="mt-4 text-sm font-medium text-primary">{message}</p> : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="table-head-cell">Nome</th>
                <th className="table-head-cell">Fila</th>
                <th className="table-head-cell">Classificação</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Prioridade</th>
                <th className="table-head-cell">Tempo de Espera</th>
                <th className="table-head-cell">Idade</th>
                <th className="table-head-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="table-cell text-muted-foreground" colSpan={8}>
                    Carregando fila ambulatorial...
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="table-cell">{row.patientName}</td>
                  <td className="table-cell">{row.queueName}</td>
                  <td className="table-cell">
                    <RiskPill level={riskClassificationToLabel(row.riskClassification)} compact />
                  </td>
                  <td className="table-cell">
                    <StatusPill>{row.status.replaceAll("_", " ")}</StatusPill>
                  </td>
                  <td className="table-cell">{row.priority}</td>
                  <td className="table-cell text-[#EF4444]">
                    {new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
                      -Math.max(1, Math.round((Date.now() - new Date(row.waitingSince).getTime()) / 60000)),
                      "minute"
                    )}
                  </td>
                  <td className="table-cell">{row.patientAge ?? "-"} anos</td>
                  <td className="table-cell">
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        onClick={() => void handleQueueAction(row)}
                        disabled={
                          activeRowId === row.id ||
                          (row.status === "AGUARDANDO_TRIAGEM" && !canCallTriage) ||
                          (row.status === "AGUARDANDO_MEDICO" && !canCallMedical)
                        }
                        title={
                          row.status === "AGUARDANDO_TRIAGEM" && !canCallTriage
                            ? getPermissionMessage("queue.callTriage")
                            : row.status === "AGUARDANDO_MEDICO" && !canCallMedical
                              ? getPermissionMessage("queue.callMedical")
                              : undefined
                        }
                      >
                        {activeRowId === row.id
                          ? "Abrindo..."
                          : row.status === "AGUARDANDO_TRIAGEM"
                            ? "Chamar triagem"
                            : row.status === "AGUARDANDO_MEDICO"
                              ? "Chamar médico"
                              : "Abrir"}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={currentRole === "RECEPTIONIST" ? `/patients/${row.patientId}` : `/patients/${row.patientId}/record`}>
                          <FileText className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">Mostrando {rows.length} paciente(s)</p>
      </div>

      <PatientIntakeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => void handleModalSubmit(payload)}
        demo={forceDemo}
        submitting={modalSubmitting}
        error={modalError}
      />
    </AppShell>
  );
}
