"use client";

import { Activity, Bell, CheckCircle2, Stethoscope, Users, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, StatusPill } from "@/components/medsync-primitives";
import type {
  AmbulatoryAttendanceResponse,
  MedicalRecordSummaryResponse,
  NotificationResponse,
  PatientResponse,
} from "@/lib/types";
import { getAmbulatoryQueue } from "@/services/ambulatory";
import { getMedicalRecordSummary } from "@/services/medical-records";
import { getNotifications } from "@/services/notifications";
import { getPatients } from "@/services/patients";
import { isDemoModeEnabled } from "@/services/runtime";
import { riskClassificationToLabel } from "@/services/triage";

const metricIcons = [Users, ClipboardList, Activity, Stethoscope, CheckCircle2, Bell] as const;
const metricTones = ["blue", "orange", "purple", "green", "green", "red"] as const;

type DashboardState = {
  usingDemo: boolean;
  patients: PatientResponse[];
  queue: AmbulatoryAttendanceResponse[];
  notifications: NotificationResponse[];
  summary: MedicalRecordSummaryResponse;
};

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

async function loadDashboardData(demo: boolean): Promise<DashboardState> {
  const [patients, queue, notifications, summary] = await Promise.all([
    getPatients({ demo }),
    getAmbulatoryQueue({ demo }),
    getNotifications({ demo }),
    getMedicalRecordSummary({ demo }),
  ]);

  return {
    usingDemo: demo,
    patients,
    queue,
    notifications,
    summary,
  };
}

export function DashboardLivePage() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const live = await loadDashboardData(false);
        if (mounted) {
          setData(live);
          setError(null);
        }
      } catch {
        if (!mounted) return;

        if (isDemoModeEnabled()) {
          const demo = await loadDashboardData(true);
          if (mounted) {
            setData(demo);
            setError(null);
          }
        } else {
          setData(null);
          setError("Não foi possível carregar os dados reais do dashboard agora.");
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
  }, []);

  const queue = data?.queue || [];
  const notifications = data?.notifications || [];
  const summary = data?.summary;
  const riskSummary = buildRiskSummary(queue);

  const metrics = [
    { label: "Pacientes cadastrados", value: data?.patients.length ?? 0 },
    { label: "Na fila", value: queue.filter((item) => item.status !== "FINALIZADO").length },
    { label: "Aguardando triagem", value: queue.filter((item) => item.status === "AGUARDANDO_TRIAGEM").length },
    { label: "Aguardando médico", value: queue.filter((item) => item.status === "AGUARDANDO_MEDICO").length },
    { label: "Finalizados hoje", value: summary?.medicalAttendancesToday ?? 0 },
    { label: "Notificações", value: notifications.filter((item) => !item.read).length },
  ];

  return (
    <AppShell
      title="Dashboard"
      description="Visão geral do hospital em tempo real"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-6">
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

        <section className="grid gap-4 xl:grid-cols-6">
          {metrics.map((metric, index) => {
            const Icon = metricIcons[index];
            return <MetricCard key={metric.label} icon={Icon} label={metric.label} value={loading ? "..." : metric.value} tone={metricTones[index]} />;
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Fila resumida</h2>
            <div className="mt-5 space-y-6">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando fila...</p>
              ) : queue.length ? (
                queue.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{item.patientName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{riskClassificationToLabel(item.riskClassification) || "Sem classificação"}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.status.toLowerCase().replaceAll("_", " ")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum paciente na fila.</p>
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Triagens por risco</h2>
            <div className="mt-5 space-y-3">
              {riskSummary.map((risk) => (
                <div key={risk.label} className="flex items-center justify-between text-[14px] font-medium text-foreground">
                  <span>{risk.label}</span>
                  <span>{loading ? "..." : risk.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Últimas notificações</h2>
            <div className="mt-5 space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando notificações...</p>
              ) : notifications.length ? (
                notifications.slice(0, 2).map((notification) => (
                  <div key={notification.id} className="border-l-2 border-primary pl-3">
                    <p className="text-[14px] font-semibold text-foreground">{notification.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem notificações recentes.</p>
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Status técnico dos serviços</h2>
            <div className="mt-5 space-y-3">
              {[
                { label: "API Gateway", online: true },
                { label: "Patients Service", online: Boolean(data) },
                { label: "Triage Service", online: queue.length > 0 || Boolean(data) },
                { label: "Medical Record Service", online: Boolean(summary) },
                { label: "Notifications Service", online: notifications.length > 0 || Boolean(data) },
                { label: "MongoDB", online: Boolean(summary) },
              ].map((service) => (
                <div key={service.label} className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-foreground">{service.label}</span>
                  <StatusPill tone={service.online ? "green" : "slate"}>
                    {service.online ? (data?.usingDemo ? "Fallback demo" : "Online") : "Sem dados"}
                  </StatusPill>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
