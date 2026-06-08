import { Activity, FileText, Stethoscope, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ModuleCard } from "@/components/medsync-primitives";
import { ambulatoryModules } from "@/lib/medsync-demo";

const icons = [Stethoscope, Users, Activity, FileText] as const;

export default function AmbulatorialPage() {
  return (
    <AppShell
      title="Ambulatorial"
      description="Fluxos operacionais do ambulatório organizados por módulo."
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Ambulatorial" },
      ]}
    >
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {ambulatoryModules.map((module, index) => (
          <ModuleCard key={module.title} href={module.href} title={module.title} description={module.description} icon={icons[index]} />
        ))}
      </div>
    </AppShell>
  );
}
