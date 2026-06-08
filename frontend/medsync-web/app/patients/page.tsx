"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import type { PatientResponse } from "@/lib/types";
import { getPatients } from "@/services/patients";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";

function getPatientAge(birthDate?: string) {
  if (!birthDate) return "-";
  const now = new Date();
  const birth = new Date(birthDate);
  return now.getFullYear() - birth.getFullYear();
}

export default function PatientsPage() {
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPatients({ demo: forceDemo });
        if (mounted) {
          setPatients(data);
        }
      } catch (rawError) {
        if (mounted) {
          setError(getServiceErrorMessage(rawError, "Não foi possível carregar os pacientes."));
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
      title="Pacientes"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Pacientes" },
      ]}
      actions={
        <Button asChild>
          <Link href="/patients/new">Novo paciente</Link>
        </Button>
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

      <div className="surface-card overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-head-cell">Nome</th>
              <th className="table-head-cell">CPF</th>
              <th className="table-head-cell">CNS</th>
              <th className="table-head-cell">Idade</th>
              <th className="table-head-cell">Telefone</th>
              <th className="table-head-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="table-cell text-muted-foreground" colSpan={6}>
                  Carregando pacientes...
                </td>
              </tr>
            ) : null}
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="table-cell">{patient.fullName}</td>
                <td className="table-cell">{patient.documentNumber}</td>
                <td className="table-cell">{patient.cns || "-"}</td>
                <td className="table-cell">{getPatientAge(patient.birthDate)}</td>
                <td className="table-cell">{patient.phone}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/patients/${patient.id}/record`}>Prontuário</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/patients/${patient.id}/timeline`}>Timeline</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
