"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import type { MedicalRecordSummaryResponse, NotificationResponse, PatientResponse } from "@/lib/types";
import { getMedicalRecordSummary } from "@/services/medical-records";
import { getNotifications } from "@/services/notifications";
import { getPatients } from "@/services/patients";
import { isDemoModeEnabled } from "@/services/runtime";

type ReportsState = {
  usingDemo: boolean;
  patients: PatientResponse[];
  notifications: NotificationResponse[];
  summary: MedicalRecordSummaryResponse;
};

async function loadReportsData(demo: boolean): Promise<ReportsState> {
  const [patients, notifications, summary] = await Promise.all([
    getPatients({ demo }),
    getNotifications({ demo }),
    getMedicalRecordSummary({ demo }),
  ]);

  return { usingDemo: demo, patients, notifications, summary };
}

export function ReportsLivePage() {
  const [data, setData] = useState<ReportsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const live = await loadReportsData(false);
        if (mounted) {
          setData(live);
          setError(null);
        }
      } catch {
        if (!mounted) return;
        if (isDemoModeEnabled()) {
          const demo = await loadReportsData(true);
          if (mounted) {
            setData(demo);
            setError(null);
          }
        } else {
          setData(null);
          setError("Não foi possível carregar os relatórios reais agora.");
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

  const cards = [
    {
      title: "Relatório de pacientes",
      description: `${data?.patients.length ?? 0} pacientes disponíveis para exportação.`,
    },
    {
      title: "Relatório de triagens",
      description: `${data?.summary.triagesRegistered ?? 0} triagens registradas no prontuário.`,
    },
    {
      title: "Relatório de atendimentos",
      description: `${data?.summary.medicalAttendancesToday ?? 0} atendimentos médicos concluídos hoje.`,
    },
    {
      title: "Relatório de notificações",
      description: `${data?.notifications.length ?? 0} notificações operacionais disponíveis.`,
    },
    {
      title: "Relatório de vacinas pendentes",
      description: `${data?.summary.patientsWithPendingVaccines ?? 0} pacientes com pendências vacinais.`,
    },
    {
      title: "Relatório de alergias",
      description: `${data?.summary.patientsWithAllergies ?? 0} pacientes com alergias registradas.`,
    },
  ];

  return (
    <AppShell
      title="Relatórios"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Relatórios" },
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

        <div className="grid gap-4 xl:grid-cols-3">
          {cards.map((report) => (
            <div key={report.title} className="surface-card p-5">
              <h2 className="text-[16px] font-semibold text-foreground">{report.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{loading ? "Carregando dados..." : report.description}</p>
              <Button className="mt-4">Gerar</Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
