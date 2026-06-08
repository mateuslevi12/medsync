import { AppShell } from "@/components/app-shell";

export default function ConfiguracoesPage() {
  return (
    <AppShell
      title="Configurações"
      description="Parâmetros visuais e operacionais da unidade."
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Configurações" },
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="text-[16px] font-semibold text-foreground">Unidade</h2>
          <p className="mt-3 text-sm text-muted-foreground">HOSP. MUN. MONSENHOR DOURADO</p>
        </div>
        <div className="surface-card p-5">
          <h2 className="text-[16px] font-semibold text-foreground">Integrações</h2>
          <p className="mt-3 text-sm text-muted-foreground">Ambiente preparado para backend, monitoramento e notificações.</p>
        </div>
      </div>
    </AppShell>
  );
}
