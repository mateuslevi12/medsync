"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, ChevronRight, LogOut, Menu, PlusCircle, ShieldCheck, Users2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clearSession, USER_KEY } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavigationItem = {
  title: string;
  href: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigation: NavigationItem[] = [
  {
    title: "Pacientes",
    href: "/patients",
    caption: "Listagem e busca clínica",
    icon: Users2,
  },
  {
    title: "Novo cadastro",
    href: "/patients/new",
    caption: "Admissão assistida",
    icon: PlusCircle,
  },
];

function formatRole(role?: string) {
  const normalized = (role ?? "").toUpperCase();

  if (normalized === "ADMIN") return "Administrador";
  if (normalized === "DOCTOR") return "Médico";
  if (normalized === "NURSE") return "Enfermagem";
  if (normalized === "RECEPTION") return "Recepção";
  return role || "Equipe assistencial";
}

type SidebarContentProps = {
  pathname: string;
  userName: string;
  userRole: string;
  onNavigate?: () => void;
  onLogout: () => void;
};

function SidebarContent({ pathname, userName, userRole, onNavigate, onLogout }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border/70 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-sidebar-primary/10 text-sidebar-primary shadow-soft">
            <Activity className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-sidebar-foreground">MedSync</h1>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Online</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Gestão hospitalar distribuída</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <Badge variant="secondary" className="mb-4 w-fit bg-sidebar-accent text-sidebar-accent-foreground">
          Ambiente assistencial seguro
        </Badge>
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isPatientsRoute = item.href === "/patients" && pathname.startsWith("/patients") && !pathname.startsWith("/patients/new");
            const isNewRoute = item.href === "/patients/new" && pathname.startsWith("/patients/new");
            const isActive = isPatientsRoute || isNewRoute;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-200",
                  isActive
                    ? "border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary shadow-soft"
                    : "border-transparent text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn("flex size-10 items-center justify-center rounded-2xl", isActive ? "bg-sidebar-primary/15" : "bg-muted/80") }>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.caption}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4 px-4 pb-5">
        <div className="rounded-3xl border border-sidebar-border/70 bg-sidebar-accent/70 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary/10 text-sidebar-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Operação monitorada</p>
              <p className="text-xs text-muted-foreground">Conformidade e rastreabilidade ativas</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            A interface foi organizada para navegação rápida, leitura clara dos dados e sensação de ambiente clínico profissional.
          </p>
        </div>

        <div className="rounded-3xl border border-sidebar-border/70 bg-background/70 p-4 backdrop-blur-xl">
          <p className="text-sm font-semibold text-sidebar-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{userRole}</p>
          <Button variant="outline" className="mt-4 w-full justify-start" onClick={onLogout}>
            <LogOut className="size-4" />
            Sair do sistema
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ title, description, actions, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("Equipe MedSync");
  const [userRole, setUserRole] = useState("Equipe assistencial");

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY);
      if (!rawUser) return;
      const user = JSON.parse(rawUser) as { name?: string; role?: string };
      if (user.name) setUserName(user.name);
      if (user.role) setUserRole(formatRole(user.role));
    } catch {
      setUserName("Equipe MedSync");
      setUserRole("Equipe assistencial");
    }
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-[320px] border-r border-sidebar-border/70 bg-sidebar lg:flex lg:flex-col">
          <SidebarContent pathname={pathname} userName={userName} userRole={userRole} onLogout={handleLogout} />
        </aside>

        <div className={cn("fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm transition-all lg:hidden", mobileOpen ? "opacity-100" : "pointer-events-none opacity-0")}>
          <aside className={cn("absolute left-0 top-0 h-full w-[88vw] max-w-[320px] border-r border-sidebar-border/70 bg-sidebar shadow-2xl transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
            <div className="flex items-center justify-end p-4">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Fechar navegação">
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent
              pathname={pathname}
              userName={userName}
              userRole={userRole}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-2xl">
            <div className="page-shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3 md:items-center">
                <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir navegação">
                  <Menu className="size-5" />
                </Button>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      Sistema hospitalar
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                  {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                <ThemeToggle />
                {actions}
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="page-shell space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
