import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { RiskLevel, TimelineEvent } from "@/lib/medsync-demo";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "blue" | "orange" | "purple" | "green" | "red";
};

const toneStyles: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  blue: "bg-[#EEF4FF] text-primary",
  orange: "bg-[#FFF7ED] text-[#F97316]",
  purple: "bg-[#F5F3FF] text-[#7C3AED]",
  green: "bg-[#ECFDF3] text-[#16A34A]",
  red: "bg-[#FEF2F2] text-[#EF4444]",
};

export function MetricCard({ label, value, icon: Icon, tone = "blue" }: MetricCardProps) {
  return (
    <div className="metric-card p-4">
      <div className={cn("mb-4 flex size-9 items-center justify-center rounded-xl", toneStyles[tone])}>
        <Icon className="size-4" />
      </div>
      <p className="text-[16px] font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "red" | "blue";
}) {
  const toneClass = {
    slate: "bg-[#EEF2F7] text-foreground",
    green: "bg-[#DCFCE7] text-[#16A34A]",
    red: "bg-[#FEE2E2] text-[#EF4444]",
    blue: "bg-[#DBEAFE] text-primary",
  }[tone];

  return <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-semibold", toneClass)}>{children}</span>;
}

export function RiskPill({
  level,
  compact = false,
}: {
  level: RiskLevel | null;
  compact?: boolean;
}) {
  if (!level) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const className = {
    "EMERGÊNCIA": "border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626]",
    "MUITO URGENTE": "border-[#FDBA74] bg-[#FFF7ED] text-[#EA580C]",
    URGENTE: "border-[#FCD34D] bg-[#FEFCE8] text-[#CA8A04]",
    "POUCO URGENTE": "border-[#86EFAC] bg-[#F0FDF4] text-[#16A34A]",
    "NÃO URGENTE": "border-[#93C5FD] bg-[#EFF6FF] text-[#2563EB]",
  }[level];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-semibold",
        compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
        className
      )}
    >
      {level}
    </span>
  );
}

export function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="metric-card flex min-h-[172px] flex-col justify-between p-6 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-primary">
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

export function ActionListCard({
  actions,
  onActionClick,
  disabledActions = [],
  className,
}: {
  actions: string[];
  onActionClick?: (action: string) => void;
  disabledActions?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[280px] max-w-[300px] flex-col gap-[10px] rounded-2xl border border-[#E2E8F0] bg-white p-[14px]",
        "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] xl:sticky xl:top-[88px]",
        className
      )}
    >
      <div className="flex flex-col gap-[10px]">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onActionClick?.(action)}
            disabled={disabledActions.includes(action)}
            className={cn(
              "flex h-12 min-h-12 w-full items-center justify-start rounded-[10px] border px-[14px] text-left text-[15px] font-semibold leading-5",
              "shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-150 ease-in-out",
              "bg-[#EFF6FF] border-[#DBEAFE] text-[#111827] hover:-translate-y-[1px] hover:bg-[#DBEAFE] hover:border-[#BFDBFE] active:translate-y-0 active:bg-[#BFDBFE]",
              "disabled:cursor-not-allowed disabled:border-[#E2E8F0] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:shadow-none disabled:hover:translate-y-0"
            )}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PatientInfoStrip({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="surface-card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">{item.label}</p>
          <p className="mt-1 text-[14px] font-semibold text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function TimelineList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => (
        <div key={`${event.date}-${event.title}`} className="relative flex gap-4 border-b border-border px-6 py-5 last:border-b-0">
          <div className="relative pt-1">
            <span className="relative z-10 mt-1 block size-3 rounded-full bg-primary" />
            {index < events.length - 1 ? <span className="absolute left-[5px] top-3 h-full w-px bg-[#BFDBFE]" /> : null}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{event.date}</p>
            <p className="text-[16px] font-semibold text-foreground">{event.title}</p>
            {event.description ? <p className="mt-1 text-sm text-muted-foreground">{event.description}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShortcutLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      {label}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}
