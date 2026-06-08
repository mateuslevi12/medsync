"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/medsync-primitives";
import { Button } from "@/components/ui/button";
import type { NotificationResponse } from "@/lib/types";
import { getNotifications } from "@/services/notifications";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";

function notificationCategory(type: NotificationResponse["type"]) {
  switch (type) {
    case "PATIENT_ADDED_TO_QUEUE":
      return "Fila";
    case "TRIAGE_STARTED":
    case "TRIAGE_COMPLETED":
      return "Acolhimento";
    case "MEDICAL_STARTED":
    case "MEDICAL_FINISHED":
      return "Atendimento";
    default:
      return "Operação";
  }
}

export default function NotificacoesPage() {
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getNotifications({ demo: forceDemo });
        if (mounted) {
          setNotifications(data);
        }
      } catch (rawError) {
        if (mounted) {
          setError(getServiceErrorMessage(rawError, "Não foi possível carregar as notificações."));
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

  return (
    <AppShell
      title="Notificações"
      description="Eventos operacionais do fluxo hospitalar."
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Notificações" },
      ]}
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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

        {loading ? <div className="surface-card p-5 text-sm text-muted-foreground">Carregando notificações...</div> : null}

        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`surface-card p-5 ${notification.read ? "" : "border-primary/30 bg-[#F8FBFF]"}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[16px] font-semibold text-foreground">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              </div>
              <StatusPill tone={notification.read ? "slate" : "blue"}>
                {notificationCategory(notification.type)}
              </StatusPill>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString("pt-BR")}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
