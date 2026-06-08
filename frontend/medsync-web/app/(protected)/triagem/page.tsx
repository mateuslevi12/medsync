import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getQueueWithPatients } from "@/lib/medsync-demo";

export default function TriagemPage() {
  const triageQueue = getQueueWithPatients().filter((item) => item.queue === "ACOLHIMENTO");

  return (
    <AppShell
      title="Triagem"
      description="Lista rápida de acolhimentos pendentes."
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Triagem" },
      ]}
    >
      <div className="surface-card overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-head-cell">Paciente</th>
              <th className="table-head-cell">CPF</th>
              <th className="table-head-cell">Status</th>
              <th className="table-head-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {triageQueue.map((item) => (
              <tr key={item.patientId}>
                <td className="table-cell">{item.patient?.fullName}</td>
                <td className="table-cell">{item.patient?.cpf}</td>
                <td className="table-cell">{item.status}</td>
                <td className="table-cell">
                  <Button asChild size="sm">
                    <Link href={`/acolhimento/${item.patientId}`}>Abrir acolhimento</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
