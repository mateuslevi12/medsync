"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PatientInfoStrip, ShortcutLink, StatusPill } from "@/components/medsync-primitives";
import { Button } from "@/components/ui/button";
import { getCurrentUser, hasPermission } from "@/lib/rbac";
import type { AmbulatoryAttendanceResponse, PatientResponse, PatientTimelineEventResponse } from "@/lib/types";
import { getAmbulatoryQueue } from "@/services/ambulatory";
import { getPatientTimeline } from "@/services/medical-records";
import { getPatientById } from "@/services/patients";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>();
  const canViewRecord = hasPermission("record.view", getCurrentUser()?.role);
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [queueEntry, setQueueEntry] = useState<AmbulatoryAttendanceResponse | null>(null);
  const [timeline, setTimeline] = useState<PatientTimelineEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [patientData, queue, timelineData] = await Promise.all([
          getPatientById(params.id, { demo: forceDemo }),
          getAmbulatoryQueue({ demo: forceDemo }),
          getPatientTimeline(params.id, { demo: forceDemo }),
        ]);

        if (!mounted) return;
        setPatient(patientData);
        setQueueEntry(queue.find((item) => item.patientId === Number(params.id)) || null);
        setTimeline(timelineData);
      } catch (rawError) {
        if (mounted) {
          setError(getServiceErrorMessage(rawError, "Não foi possível carregar o resumo do paciente."));
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
  }, [forceDemo, params.id]);

  const age = useMemo(() => {
    if (!patient?.birthDate) return "-";
    const now = new Date();
    const birth = new Date(patient.birthDate);
    return now.getFullYear() - birth.getFullYear();
  }, [patient?.birthDate]);

  return (
    <AppShell
      title={patient ? `Paciente · ${patient.fullName}` : "Paciente"}
      description="Resumo cadastral e operacional do paciente."
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Pacientes", href: "/patients" },
        { label: patient?.fullName || "Paciente" },
      ]}
      actions={
        patient ? (
          <>
            <Button asChild variant="outline">
              <Link href={`/patients/${patient.id}/edit`}>Editar cadastro</Link>
            </Button>
            {canViewRecord ? (
              <Button asChild>
                <Link href={`/patients/${patient.id}/record`}>Abrir prontuário</Link>
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            {!forceDemo ? (
              <Button variant="outline" size="sm" onClick={() => setForceDemo(true)}>
                Usar modo demonstração
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading || !patient ? (
        <div className="surface-card p-5 text-sm text-muted-foreground">Carregando dados do paciente...</div>
      ) : (
        <div className="space-y-6">
          <PatientInfoStrip
            items={[
              { label: "CPF", value: patient.documentNumber },
              { label: "CNS", value: patient.cns || "-" },
              { label: "Idade", value: `${age} anos` },
              { label: "Telefone", value: patient.phone },
              { label: "Endereço", value: patient.address },
            ]}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="surface-card p-5">
              <h2 className="text-[16px] font-semibold text-foreground">Visão geral</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">Status na fila</p>
                  <div className="mt-3">
                    {queueEntry ? <StatusPill>{queueEntry.status.replaceAll("_", " ")}</StatusPill> : <StatusPill tone="green">Sem pendências</StatusPill>}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">Último evento</p>
                  <p className="mt-3 text-sm text-foreground">{timeline[0]?.title || "Sem eventos registrados."}</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="text-[16px] font-semibold text-foreground">Atalhos</h2>
              <div className="mt-4 space-y-3">
                {canViewRecord ? <ShortcutLink href={`/patients/${patient.id}/record`} label="Abrir prontuário" /> : null}
                <ShortcutLink href={`/patients/${patient.id}/timeline`} label="Abrir timeline completa" />
                <ShortcutLink href="/fila-atendimento" label="Voltar para fila de atendimento" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
