"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/medsync-primitives";
import type { AmbulatoryAttendanceResponse, MedicalRecordSummaryResponse, NotificationResponse } from "@/lib/types";
import { getAmbulatoryQueue } from "@/services/ambulatory";
import { getMedicalRecordSummary } from "@/services/medical-records";
import { getNotifications } from "@/services/notifications";
import { isDemoModeEnabled } from "@/services/runtime";

type MonitoringState = {
  usingDemo: boolean;
  queue: AmbulatoryAttendanceResponse[];
  notifications: NotificationResponse[];
  summary: MedicalRecordSummaryResponse;
};

async function loadMonitoringData(demo: boolean): Promise<MonitoringState> {
  const [queue, notifications, summary] = await Promise.all([
    getAmbulatoryQueue({ demo }),
    getNotifications({ demo }),
    getMedicalRecordSummary({ demo }),
  ]);

  return { usingDemo: demo, queue, notifications, summary };
}

function buildHospitalSummary(queue: AmbulatoryAttendanceResponse[]) {
  return [
    { label: "Aguardando triagem", value: queue.filter((item) => item.status === "AGUARDANDO_TRIAGEM").length },
    { label: "Em triagem", value: queue.filter((item) => item.status === "EM_TRIAGEM").length },
    { label: "Aguardando médico", value: queue.filter((item) => item.status === "AGUARDANDO_MEDICO").length },
    { label: "Em atendimento", value: queue.filter((item) => item.status === "EM_ATENDIMENTO_MEDICO").length },
    { label: "Finalizado", value: queue.filter((item) => item.status === "FINALIZADO").length },
  ];
}

function buildRiskSummary(queue: AmbulatoryAttendanceResponse[]) {
  const counters: Record<string, number> = {
    EMERGENCIA: 0,
    MUITO_URGENTE: 0,
    URGENTE: 0,
    POUCO_URGENTE: 0,
    NAO_URGENTE: 0,
  };

  queue.forEach((item) => {
    if (item.riskClassification) {
      counters[item.riskClassification] += 1;
    }
  });

  return [
    { label: "EMERGÊNCIA", value: counters.EMERGENCIA },
    { label: "MUITO URGENTE", value: counters.MUITO_URGENTE },
    { label: "URGENTE", value: counters.URGENTE },
    { label: "POUCO URGENTE", value: counters.POUCO_URGENTE },
    { label: "NÃO URGENTE", value: counters.NAO_URGENTE },
  ];
}

export function MonitoringLivePage() {
  const [data, setData] = useState<MonitoringState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const live = await loadMonitoringData(false);
        if (mounted) {
          setData(live);
          setError(null);
        }
      } catch {
        if (!mounted) return;
        if (isDemoModeEnabled()) {
          const demo = await loadMonitoringData(true);
          if (mounted) {
            setData(demo);
            setError(null);
          }
        } else {
          setData(null);
          setError("Não foi possível carregar os indicadores reais de monitoramento agora.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const queue = data?.queue || [];
  const hospitalSummary = buildHospitalSummary(queue);
  const riskSummary = buildRiskSummary(queue);

  const technicalServices = [
    { label: "API Gateway", online: true },
    { label: "Triage Service", online: Boolean(data) },
    { label: "Medical Record Service", online: Boolean(data?.summary) },
    { label: "Notifications Service", online: Boolean(data?.notifications) || Boolean(data) },
    { label: "MongoDB", online: Boolean(data?.summary) },
    { label: "Prometheus", online: true },
    { label: "Grafana", online: true },
  ];

  return (
    <AppShell
      title="Monitoramento"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Monitoramento" },
      ]}
    >
      <div className="space-y-4">
        {data?.usingDemo ? (
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary">
            Exibindo fallback demo porque as APIs reais não responderam.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error} Faça login novamente ou recarregue a página após a stack estabilizar.
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Hospitalar — Pacientes por status</h2>
            <div className="mt-5 space-y-3">
              {hospitalSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[14px] font-medium text-foreground">
                  <span>{item.label}</span>
                  <span>{loading ? "..." : item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Triagens por risco</h2>
            <div className="mt-5 space-y-3">
              {riskSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[14px] font-medium text-foreground">
                  <span>{item.label}</span>
                  <span>{loading ? "..." : item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Observabilidade técnica</h2>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {technicalServices.map((service) => (
                <div key={service.label} className="rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-foreground">{service.label}</span>
                    <StatusPill tone={service.online ? "green" : "slate"}>
                      {service.online ? (data?.usingDemo ? "Fallback demo" : "Online") : "Sem dados"}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-4 text-sm font-medium text-primary">
              <a href="http://localhost:9090" target="_blank" rel="noreferrer">
                Abrir Prometheus
              </a>
              <a href="http://localhost:3001" target="_blank" rel="noreferrer">
                Abrir Grafana
              </a>
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Prontuário e notificações</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-[14px] font-medium text-foreground">
                <span>Prontuários em MongoDB</span>
                <span>{loading ? "..." : data?.summary.totalRecords ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] font-medium text-foreground">
                <span>Atendimentos médicos hoje</span>
                <span>{loading ? "..." : data?.summary.medicalAttendancesToday ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] font-medium text-foreground">
                <span>Triagens registradas</span>
                <span>{loading ? "..." : data?.summary.triagesRegistered ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] font-medium text-foreground">
                <span>Notificações emitidas</span>
                <span>{loading ? "..." : data?.notifications.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
