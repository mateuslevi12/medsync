"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TimelineList } from "@/components/medsync-primitives";
import { Button } from "@/components/ui/button";
import { getPatientTimeline } from "@/services/medical-records";
import { getPatientById } from "@/services/patients";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";

export default function PatientTimelinePage() {
  const params = useParams<{ id: string }>();
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [patientName, setPatientName] = useState("Paciente");
  const [events, setEvents] = useState<Array<{ date: string; title: string; description?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [patient, timeline] = await Promise.all([
          getPatientById(params.id, { demo: forceDemo }),
          getPatientTimeline(params.id, { demo: forceDemo }),
        ]);

        if (!mounted) return;

        setPatientName(patient?.fullName || "Paciente");
        setEvents(
          timeline.map((event) => ({
            date: new Date(event.createdAt).toLocaleString("pt-BR"),
            title: event.title,
            description: event.description || undefined,
          }))
        );
      } catch (rawError) {
        if (!mounted) return;

        if (!forceDemo && isDemoModeEnabled()) {
          setForceDemo(true);
          return;
        }

        setError(getServiceErrorMessage(rawError, "Não foi possível carregar a timeline."));
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

  return (
    <AppShell
      title={`Timeline · ${patientName}`}
      breadcrumbs={[
        { label: "Pacientes", href: "/patients" },
        { label: "Timeline" },
      ]}
    >
      <div className="space-y-4">
        <Link href="/patients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          &lt; Voltar
        </Link>

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

        <div className="surface-card overflow-hidden">
          {loading ? (
            <div className="p-5 text-sm text-muted-foreground">Carregando timeline...</div>
          ) : (
            <TimelineList events={events} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
