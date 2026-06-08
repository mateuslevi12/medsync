import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/medsync-primitives";
import { demoUsers } from "@/lib/medsync-demo";

export default function UsuariosPage() {
  return (
    <AppShell
      title="Usuários"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Usuários" },
      ]}
    >
      <div className="surface-card overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-head-cell">Nome</th>
              <th className="table-head-cell">E-mail</th>
              <th className="table-head-cell">Perfil</th>
              <th className="table-head-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {demoUsers.map((user) => (
              <tr key={user.id}>
                <td className="table-cell">{user.name}</td>
                <td className="table-cell">{user.email}</td>
                <td className="table-cell">{user.profile}</td>
                <td className="table-cell">
                  <StatusPill tone="green">{user.status}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
