"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearSession, getStoredUser } from "@/lib/session";
import { hasPermission, roleLabel } from "@/lib/rbac";
import { getUnreadNotifications } from "@/services/notifications";
import { isDemoModeEnabled } from "@/services/runtime";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppShellProps = {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavigationItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  match: (pathname: string) => boolean;
};

const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard",
  },
  {
    title: "Ambulatorial",
    href: "/ambulatorial",
    icon: Building2,
    match: (pathname) => pathname.startsWith("/ambulatorial"),
  },
  {
    title: "Fila de Atendimento",
    href: "/fila-atendimento",
    icon: Stethoscope,
    match: (pathname) =>
      pathname.startsWith("/fila-atendimento") ||
      pathname.startsWith("/fila-espera") ||
      pathname.startsWith("/acolhimento") ||
      pathname.startsWith("/atendimento-medico") ||
      pathname.startsWith("/triagem"),
  },
  {
    title: "Pacientes",
    href: "/patients",
    icon: Users,
    match: (pathname) => pathname.startsWith("/patients"),
  },
  {
    title: "Notificações",
    href: "/notificacoes",
    icon: Bell,
    match: (pathname) => pathname.startsWith("/notificacoes"),
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: ShieldCheck,
    match: (pathname) => pathname.startsWith("/usuarios"),
  },
  {
    title: "Monitoramento",
    href: "/monitoramento",
    icon: Activity,
    match: (pathname) => pathname.startsWith("/monitoramento"),
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: FileText,
    match: (pathname) => pathname.startsWith("/relatorios"),
  },
];

const secondaryNavigation: NavigationItem[] = [
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    match: (pathname) => pathname.startsWith("/configuracoes"),
  },
];

function defaultBreadcrumbs(pathname: string, title?: string): BreadcrumbItem[] {
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    ambulatorial: "Ambulatorial",
    "fila-atendimento": "Fila de Atendimento",
    "fila-espera": "Fila de Atendimento",
    acolhimento: "Acolhimento",
    "atendimento-medico": "Atendimento Médico",
    patients: "Pacientes",
    record: "Prontuário",
    timeline: "Timeline",
    triagem: "Triagem",
    notificacoes: "Notificações",
    usuarios: "Usuários",
    monitoramento: "Monitoramento",
    relatorios: "Relatórios",
    configuracoes: "Configurações",
    new: "Novo",
    edit: "Editar",
  };

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = segments.map((segment, index) => ({
    label: labelMap[segment] || segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  if (!items.length && title) {
    return [{ label: title }];
  }

  if (title && items[items.length - 1]?.label !== title) {
    items.push({ label: title });
  }

  return items;
}

type SidebarContentProps = {
  pathname: string;
  userName: string;
  userRole: string;
  rawUserRole: Role | null;
  notificationCount: number;
  onNavigate?: () => void;
  onLogout: () => void;
};

function SidebarContent({
  pathname,
  userName,
  userRole,
  rawUserRole,
  notificationCount,
  onNavigate,
  onLogout,
}: SidebarContentProps) {
  const navigationWithBadge = navigation
    .filter((item) => (item.href === "/usuarios" ? hasPermission("users.access", rawUserRole) : true))
    .map((item) =>
    item.href === "/notificacoes"
      ? {
          ...item,
          badge: notificationCount,
        }
      : item
  );

  function renderLink(item: NavigationItem) {
    const Icon = item.icon;
    const active = item.match(pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex h-9 items-center justify-between rounded-lg px-3 text-[14px] font-medium transition-colors",
          active ? "bg-primary text-white" : "text-foreground hover:bg-[#EEF4FF]"
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="size-4" />
          {item.title}
        </span>
        {item.badge ? (
          <span
            className={cn(
              "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
              active ? "bg-white/20 text-white" : "bg-[#EF4444] text-white"
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-[20px] font-bold leading-6 text-foreground">MedSync</p>
            <p className="text-xs text-muted-foreground">HealthSys Distribuído</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">{navigationWithBadge.map(renderLink)}</nav>

      <div className="border-t border-border px-2 py-4">
        <div className="space-y-1">{secondaryNavigation.map(renderLink)}</div>
        <div className="mt-4 rounded-xl border border-border bg-white p-3">
          <p className="truncate text-[14px] font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{userRole}</p>
          <Button variant="outline" size="sm" className="mt-3 w-full justify-start" onClick={onLogout}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ title, description, breadcrumbs, actions, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("Ana Ribeiro");
  const [userRole, setUserRole] = useState("Administrador");
  const [rawUserRole, setRawUserRole] = useState<Role | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;

    if (user.name) setUserName(user.name);
    if (user.role) {
      setRawUserRole(user.role);
      setUserRole(roleLabel(user.role));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      try {
        const unread = await getUnreadNotifications({ demo: isDemoModeEnabled() });
        if (mounted) {
          setNotificationCount(unread.length);
        }
      } catch {
        if (mounted) {
          setNotificationCount(0);
        }
      }
    }

    void loadNotifications();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const breadcrumbItems = useMemo(
    () => (breadcrumbs && breadcrumbs.length ? breadcrumbs : defaultBreadcrumbs(pathname, title)),
    [breadcrumbs, pathname, title]
  );

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[216px] border-r border-border bg-white lg:block">
        <SidebarContent
          pathname={pathname}
          userName={userName}
          userRole={userRole}
          rawUserRole={rawUserRole}
          notificationCount={notificationCount}
          onLogout={handleLogout}
        />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-slate-950/35 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-[216px] border-r border-border bg-white transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-end p-2">
            <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
          <SidebarContent
            pathname={pathname}
            userName={userName}
            userRole={userRole}
            rawUserRole={rawUserRole}
            notificationCount={notificationCount}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </aside>
      </div>

      <div className="lg:pl-[216px]">
        <header className="sticky top-0 z-30 h-[52px] border-b border-border bg-white">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-[13px] text-muted-foreground">
                {breadcrumbItems.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
                    {index > 0 ? <ChevronRight className="size-3.5 shrink-0 text-[#94A3B8]" /> : null}
                    {item.href && index < breadcrumbItems.length - 1 ? (
                      <Link href={item.href} className="truncate text-primary hover:underline">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="truncate text-foreground">{item.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#EEF4FF] hover:text-foreground"
              >
                <Bell className="size-4" />
                {notificationCount ? (
                  <span className="absolute right-0 top-0 inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                ) : null}
              </button>
              <div className="hidden text-right md:block">
                <p className="text-[11px] leading-4 text-muted-foreground">Unidade</p>
                <p className="text-[14px] font-semibold leading-5 text-foreground">HOSP. MUN. MONSENHOR DOURADO</p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                AR
              </div>
            </div>
          </div>
        </header>

        <main className="page-shell">
          {title || description || actions ? (
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                {title ? <h1 className="text-[24px] font-bold leading-8 text-foreground">{title}</h1> : null}
                {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
