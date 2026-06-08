"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  MapPin,
  Phone,
  Printer,
  ShieldAlert,
  Stethoscope,
  Syringe,
  TestTube2,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { formatCns, formatCpf, formatPhone } from "@/lib/input-masks";
import type {
  AllergySnapshotResponse,
  MedicalRecordResponse,
  PatientAllergyResponse,
  PatientResponse,
  PatientTimelineEventResponse,
  PatientVaccineResponse,
  VaccineSnapshot,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getClinicalSummary } from "@/services/medical-records";
import { getPatientById } from "@/services/patients";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";
import { riskClassificationToLabel, vaccineStatusApiToLabel } from "@/services/triage";

type RecordTab = "attendances" | "triages" | "prescriptions" | "exams";

type NormalizedAllergy = {
  id: string;
  title: string;
  type?: string | null;
  severity?: string | null;
  createdAt?: string | null;
};

type NormalizedVaccine = {
  id: string;
  name: string;
  status: string;
  applicationDate?: string | null;
};

type TimelineTone = {
  dot: string;
  line: string;
};

const cidCatalog: Record<string, string> = {
  J00: "Resfriado comum",
  R50: "Febre",
  R51: "Cefaleia",
  I10: "Hipertensão essencial",
  "Z00.0": "Exame médico geral",
  E11: "Diabetes mellitus tipo 2",
};

function hasText(value?: string | number | null | boolean) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  return Boolean(String(value ?? "").trim());
}

function safeText(value?: string | number | null, fallback = "Não informado") {
  if (!hasText(value)) {
    return fallback;
  }

  return String(value).trim();
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(parsed);
}

function parseDecimal(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function patientInitials(name?: string | null) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "MS";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

function genderLabel(gender?: PatientResponse["gender"] | null) {
  if (gender === "FEMALE") return "Feminino";
  if (gender === "MALE") return "Masculino";
  if (gender === "OTHER") return "Outro";
  return null;
}

function deriveMunicipality(address?: string | null) {
  if (!address?.trim()) {
    return null;
  }

  const fragments = address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return fragments.at(-1) || address;
}

function imcStatus(value?: string | null) {
  const parsed = parseDecimal(value);
  if (parsed == null) {
    return null;
  }

  if (parsed < 18.5) return "Baixo peso";
  if (parsed < 25) return "Normal";
  if (parsed < 30) return "Sobrepeso";
  return "Obesidade";
}

function riskBadgeStyles(level?: string | null) {
  switch (level) {
    case "EMERGÊNCIA":
      return "border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626]";
    case "MUITO URGENTE":
      return "border-[#FDBA74] bg-[#FFF7ED] text-[#EA580C]";
    case "URGENTE":
      return "border-[#FCD34D] bg-[#FEF3C7] text-[#B45309]";
    case "POUCO URGENTE":
      return "border-[#86EFAC] bg-[#ECFDF3] text-[#16A34A]";
    case "NÃO URGENTE":
      return "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
    default:
      return "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]";
  }
}

function vaccineStatusStyles(status: string) {
  if (status === "Em dia") return "bg-[#DCFCE7] text-[#16A34A]";
  if (status === "Pendente") return "bg-[#FEF3C7] text-[#D97706]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function timelineTone(type?: PatientTimelineEventResponse["type"]): TimelineTone {
  switch (type) {
    case "TRIAGEM_INICIADA":
    case "TRIAGEM_FINALIZADA":
      return { dot: "bg-[#F59E0B]", line: "bg-[#FDE68A]" };
    case "ATENDIMENTO_MEDICO_FINALIZADO":
      return { dot: "bg-[#22C55E]", line: "bg-[#BBF7D0]" };
    case "ATENDIMENTO_MEDICO_INICIADO":
    case "ENCAMINHADO_MEDICO":
      return { dot: "bg-[#2563EB]", line: "bg-[#BFDBFE]" };
    case "NOTIFICACAO_GERADA":
      return { dot: "bg-[#94A3B8]", line: "bg-[#E2E8F0]" };
    case "PACIENTE_INCLUIDO_FILA":
    default:
      return { dot: "bg-[#94A3B8]", line: "bg-[#E2E8F0]" };
  }
}

function cidLabel(code: string) {
  const normalized = code.trim().toUpperCase();
  return cidCatalog[normalized] ? `${normalized} · ${cidCatalog[normalized]}` : normalized;
}

function sortByNewest<T>(items: T[], pickDate: (item: T) => string | null | undefined) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(pickDate(left) || 0).getTime();
    const rightDate = new Date(pickDate(right) || 0).getTime();
    return rightDate - leftDate;
  });
}

function normalizeAllergies(
  allergies: PatientAllergyResponse[],
  snapshots: AllergySnapshotResponse[] | undefined
): NormalizedAllergy[] {
  const source =
    allergies.length > 0
      ? allergies.map((item) => ({
          id: String(item.id),
          title: item.description,
          type: item.type,
          severity: item.severity,
          createdAt: item.createdAt,
        }))
      : (snapshots || []).map((item, index) => ({
          id: `snapshot-${index}`,
          title: item.description,
          type: item.type,
          severity: item.severity,
          createdAt: item.createdAt,
        }));

  return source.filter((item) => hasText(item.title));
}

function normalizeVaccines(
  vaccines: PatientVaccineResponse[],
  snapshots: VaccineSnapshot[] | undefined
): NormalizedVaccine[] {
  const source =
    vaccines.length > 0
      ? vaccines.map((item) => ({
          id: String(item.id),
          name: item.name,
          status: vaccineStatusApiToLabel(item.status),
          applicationDate: item.applicationDate,
        }))
      : (snapshots || []).map((item, index) => ({
          id: `snapshot-${index}`,
          name: item.name,
          status: vaccineStatusApiToLabel(item.status),
          applicationDate: item.applicationDate,
        }));

  return source.filter((item) => hasText(item.name) && hasText(item.status));
}

function latestVisitDate(record: MedicalRecordResponse) {
  const medical = sortByNewest(record.medicalAttendances, (item) => item.completedAt || item.createdAt)[0];
  if (medical?.completedAt || medical?.createdAt) {
    return medical.completedAt || medical.createdAt;
  }

  const triage = sortByNewest(record.triages, (item) => item.triageCompletedAt || item.triageStartedAt || item.createdAt)[0];
  return triage?.triageCompletedAt || triage?.triageStartedAt || triage?.createdAt || null;
}

function heroMeta(patient: PatientResponse | null, record: MedicalRecordResponse) {
  const values = [
    record.patientAge ? `${record.patientAge} anos` : null,
    genderLabel(patient?.gender),
    record.patientCpf ? `CPF ${formatCpf(record.patientCpf)}` : null,
    record.patientCns ? `CNS ${formatCns(record.patientCns)}` : null,
    record.patientPhone ? formatPhone(record.patientPhone) : null,
    deriveMunicipality(patient?.address) || null,
  ].filter(Boolean) as string[];

  return values;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tone = "blue",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: "blue" | "red" | "purple" | "green";
}) {
  const toneClass = {
    blue: "bg-[#EEF4FF] text-[#006EEB]",
    red: "bg-[#FEF2F2] text-[#EF4444]",
    purple: "bg-[#F5F3FF] text-[#7C3AED]",
    green: "bg-[#ECFDF3] text-[#16A34A]",
  }[tone];

  return (
    <div className="flex items-start gap-3">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneClass)}>
        <Icon className="size-5" />
      </div>
      <div>
        <h2 className="text-[16px] font-bold text-[#0F172A]">{title}</h2>
        {subtitle ? <p className="text-[12px] font-medium text-[#64748B]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  tone = "blue",
  bordered = true,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "blue" | "green" | "yellow";
  bordered?: boolean;
}) {
  const toneClass = {
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    green: "bg-[#ECFDF3] text-[#16A34A]",
    yellow: "bg-[#FEF3C7] text-[#D97706]",
  }[tone];

  return (
    <div className={cn("flex items-center gap-3 px-5 py-4", bordered ? "xl:border-r xl:border-[#E2E8F0]" : "")}>
      <div className={cn("flex size-9 items-center justify-center rounded-[10px]", toneClass)}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.03em] text-[#64748B]">{label}</p>
        <p className="text-[18px] font-extrabold text-[#0F172A]">{value}</p>
      </div>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
  highlighted = false,
}: {
  label: string;
  value: string;
  unit?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-[74px] rounded-[10px] border p-3",
        highlighted ? "border-[#FDE68A] bg-[#FFFBEB]" : "border-[#E2E8F0] bg-white"
      )}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#64748B]">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-1">
        <span className="text-[18px] font-extrabold text-[#0F172A]">{value}</span>
        {unit ? <span className="text-[11px] text-[#64748B]">{unit}</span> : null}
      </div>
    </div>
  );
}

function EmptyCardMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-[#64748B]">{children}</p>;
}

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-20 rounded bg-[#E2E8F0]" />
      <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="h-[124px] bg-[#D9E8FF]" />
        <div className="grid gap-px bg-[#E2E8F0] sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[78px] bg-white" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="h-[280px] rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]" />
          <div className="h-[360px] rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[180px] rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PatientRecordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [record, setRecord] = useState<MedicalRecordResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [allergies, setAllergies] = useState<PatientAllergyResponse[]>([]);
  const [vaccines, setVaccines] = useState<PatientVaccineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<RecordTab>("attendances");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const summary = await getClinicalSummary(params.id, { demo: forceDemo });
        const patientData = await getPatientById(params.id, { demo: forceDemo }).catch(() => null);

        if (!mounted) {
          return;
        }

        if (!summary.record) {
          throw new Error("Nenhum prontuário encontrado para este paciente.");
        }

        setRecord(summary.record);
        setPatient(patientData);
        setAllergies(summary.allergies);
        setVaccines(summary.vaccines);
      } catch (rawError) {
        if (!mounted) {
          return;
        }

        if (!forceDemo && isDemoModeEnabled()) {
          setForceDemo(true);
          return;
        }

        setError(getServiceErrorMessage(rawError, "Não foi possível carregar o prontuário."));
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
  }, [forceDemo, params.id, reloadToken]);

  const sortedTriages = useMemo(
    () => sortByNewest(record?.triages || [], (item) => item.triageCompletedAt || item.triageStartedAt || item.createdAt),
    [record]
  );

  const sortedAttendances = useMemo(
    () => sortByNewest(record?.medicalAttendances || [], (item) => item.completedAt || item.createdAt),
    [record]
  );

  const sortedTimeline = useMemo(
    () => sortByNewest(record?.timeline || [], (item) => item.createdAt).slice(0, 5),
    [record]
  );

  const normalizedAllergies = useMemo(
    () => normalizeAllergies(allergies, record?.allergiesSnapshot),
    [allergies, record?.allergiesSnapshot]
  );

  const normalizedVaccines = useMemo(
    () => normalizeVaccines(vaccines, record?.vaccinesSnapshot),
    [vaccines, record?.vaccinesSnapshot]
  );

  const latestTriage = sortedTriages[0] || null;
  const latestRiskLabel = riskClassificationToLabel(latestTriage?.riskClassification) || null;
  const imcLabel = latestTriage?.bmi ? `IMC ${latestTriage.bmi} · ${imcStatus(latestTriage.bmi) || "Sem classificação"}` : null;
  const latestVitalsAt = latestTriage?.triageCompletedAt || latestTriage?.triageStartedAt || latestTriage?.createdAt || null;
  const lastVisit = record ? latestVisitDate(record) : null;
  const municipality = deriveMunicipality(patient?.address) || "Não informado";

  const prescriptionItems = useMemo(() => {
    const items = sortedAttendances.flatMap((attendance) => [
      ...(attendance.medications || []).map((item) => ({
        id: `${attendance.id}-medication-${item.id}`,
        label: `${item.medicationName} — ${item.dosage}`,
        date: item.scheduledAt || attendance.completedAt || attendance.createdAt,
      })),
      ...(attendance.procedures || []).map((item) => ({
        id: `${attendance.id}-procedure-${item.id}`,
        label: `${item.procedureName}${item.observations ? ` — ${item.observations}` : ""}`,
        date: item.scheduledAt || attendance.completedAt || attendance.createdAt,
      })),
      ...(attendance.observationPrescriptions || []).map((item) => ({
        id: `${attendance.id}-observation-${item.id}`,
        label: `${item.title} — ${item.description}`,
        date: item.createdAt || attendance.completedAt || attendance.createdAt,
      })),
      ...(attendance.recipes || []).map((item) => ({
        id: `${attendance.id}-recipe-${item.id}`,
        label: `${item.recipeType === "ESPECIAL" ? "Receita especial" : "Receita comum"} — ${item.text}`,
        date: item.createdAt || attendance.completedAt || attendance.createdAt,
      })),
    ]);

    return items.filter((item) => hasText(item.label));
  }, [sortedAttendances]);

  const examItems = useMemo(() => {
    const items = sortedAttendances.flatMap((attendance) =>
      (attendance.exams || []).map((exam) => ({
        id: `${attendance.id}-exam-${exam.id}`,
        label: exam.examName,
        date: exam.createdAt || attendance.completedAt || attendance.createdAt,
      }))
    );

    return items.filter((item) => hasText(item.label));
  }, [sortedAttendances]);

  const vitalCards = useMemo(() => {
    if (!latestTriage) {
      return [];
    }

    return [
      { label: "Pressão", value: safeText(latestTriage.bloodPressure), unit: "mmHg", highlighted: hasText(latestTriage.bloodPressure) },
      { label: "Freq. cardíaca", value: safeText(latestTriage.heartRate), unit: "bpm" },
      { label: "Freq. resp.", value: safeText(latestTriage.respiratoryRate), unit: "rpm" },
      { label: "Temperatura", value: safeText(latestTriage.temperature), unit: "°C", highlighted: parseDecimal(latestTriage.temperature) != null && (parseDecimal(latestTriage.temperature) || 0) >= 37.5 },
      { label: "Saturação", value: safeText(latestTriage.oxygenSaturation), unit: "%" },
      { label: "Glicemia", value: safeText(latestTriage.glucose), unit: "mg/dL" },
      { label: "Peso", value: safeText(latestTriage.weightKg), unit: "kg" },
      { label: "IMC", value: safeText(latestTriage.bmi) },
      { label: "Altura", value: safeText(latestTriage.heightCm), unit: "cm" },
      { label: "Dor", value: safeText(latestTriage.painLevel), unit: "/10" },
      { label: "Circ. abdominal", value: safeText(latestTriage.abdominalCircumference), unit: "cm" },
    ].filter((item) => item.value !== "Não informado" || ["Pressão", "Freq. cardíaca", "Freq. resp.", "Temperatura", "Saturação", "Glicemia", "Peso", "IMC"].includes(item.label));
  }, [latestTriage]);

  function handleRetry() {
    setReloadToken((value) => value + 1);
  }

  function handlePrint() {
    try {
      if (typeof window === "undefined" || typeof window.print !== "function") {
        throw new Error("Impressão indisponível");
      }

      setNotice(null);
      window.print();
    } catch {
      setNotice("Impressão não disponível neste ambiente.");
    }
  }

  return (
    <AppShell
      title={record ? `Prontuário · ${record.patientName}` : "Prontuário"}
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Pacientes", href: "/patients" },
        { label: "Prontuário" },
      ]}
    >
      <div className="space-y-4">
        <Link href="/patients" className="inline-flex items-center text-[13px] font-medium text-[#52627A] hover:text-primary">
          &lt; Voltar
        </Link>

        {notice ? (
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8]">{notice}</div>
        ) : null}

        {error ? (
          <div className="surface-card p-5">
            <p className="text-[15px] font-semibold text-[#0F172A]">Não foi possível carregar o prontuário.</p>
            <p className="mt-1 text-sm text-[#64748B]">{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Tentar novamente
              </Button>
              {!forceDemo ? (
                <Button size="sm" onClick={() => setForceDemo(true)}>
                  Usar modo demonstração
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading ? (
          <PageSkeleton />
        ) : record ? (
          <>
            <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="bg-[linear-gradient(90deg,#006EEB_0%,#006DFF_100%)] px-6 py-5 text-white">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex size-[68px] shrink-0 items-center justify-center rounded-[16px] bg-white/20 text-[28px] font-extrabold text-white">
                      {patientInitials(record.patientName)}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-[22px] font-extrabold uppercase leading-7 text-white">{record.patientName}</h1>
                        {latestRiskLabel ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold",
                              riskBadgeStyles(latestRiskLabel)
                            )}
                          >
                            {latestRiskLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-white/95">
                        {heroMeta(patient, record).map((item) => {
                          const Icon =
                            item.includes("anos") ? UserRound : item.startsWith("CPF") ? ClipboardList : item.startsWith("CNS") ? ShieldAlert : item.includes("(") ? Phone : MapPin;

                          return (
                            <span key={item} className="inline-flex items-center gap-1.5">
                              <Icon className="size-4" />
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 xl:flex-col xl:items-end">
                    <Button
                      type="button"
                      onClick={handlePrint}
                      className="h-9 rounded-lg border-0 bg-white px-4 text-[13px] font-bold text-[#0F172A] hover:bg-white/90"
                    >
                      <Printer className="mr-2 size-4" />
                      Imprimir
                    </Button>
                    <Button
                      type="button"
                      onClick={() => router.push(`/patients/${record.patientId}/timeline`)}
                      className="h-9 rounded-lg border-0 bg-white px-4 text-[13px] font-bold text-[#0F172A] hover:bg-white/90"
                    >
                      <Clock3 className="mr-2 size-4" />
                      Timeline
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid overflow-hidden border border-t-0 border-[#DDE5F0] bg-white sm:grid-cols-2 xl:grid-cols-5">
                <SummaryMetric icon={Stethoscope} label="Atendimentos" value={String(sortedAttendances.length)} tone="blue" />
                <SummaryMetric icon={ClipboardList} label="Triagens" value={String(sortedTriages.length)} tone="blue" />
                <SummaryMetric icon={CalendarDays} label="Última visita" value={formatDate(lastVisit)} tone="blue" />
                <SummaryMetric icon={AlertTriangle} label="Alergias ativas" value={String(normalizedAllergies.length)} tone="yellow" />
                <SummaryMetric
                  icon={HeartPulse}
                  label="Pressão (últ.)"
                  value={safeText(latestTriage?.bloodPressure)}
                  tone="green"
                  bordered={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="surface-card rounded-[14px] p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <SectionHeader
                        icon={Activity}
                        title="Sinais Vitais"
                        subtitle={`Última aferição: ${formatDateTime(latestVitalsAt)}`}
                      />
                      <div className="flex flex-wrap gap-2">
                        {imcLabel ? (
                          <span className="inline-flex rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[11px] font-extrabold text-[#1D4ED8]">
                            {imcLabel}
                          </span>
                        ) : null}
                        {latestRiskLabel ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold",
                              riskBadgeStyles(latestRiskLabel)
                            )}
                          >
                            {latestRiskLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {vitalCards.map((item) => (
                        <VitalCard
                          key={item.label}
                          label={item.label}
                          value={item.value}
                          unit={item.unit}
                          highlighted={item.highlighted}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="surface-card rounded-[14px] p-4">
                  <SectionHeader icon={FileText} title="Histórico Clínico" subtitle="Todos os atendimentos e triagens" />

                  <div className="mt-4 inline-flex flex-wrap rounded-[10px] bg-[#F1F5F9] p-1">
                    {[
                      { id: "attendances", label: `Atendimentos (${sortedAttendances.length})` },
                      { id: "triages", label: `Triagens (${sortedTriages.length})` },
                      { id: "prescriptions", label: "Prescrições" },
                      { id: "exams", label: "Exames" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id as RecordTab)}
                        className={cn(
                          "rounded-[8px] px-4 py-2 text-[13px] font-bold transition-colors",
                          tab === item.id ? "bg-white text-[#0F172A] shadow-sm" : "text-[#52627A]"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    {tab === "attendances"
                      ? sortedAttendances.length > 0
                        ? sortedAttendances.map((attendance) => (
                            <div key={attendance.id} className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
                                  <CalendarDays className="size-4" />
                                  {formatDateTime(attendance.completedAt || attendance.createdAt)}
                                </div>
                                <span className="inline-flex rounded-full bg-[#F8FAFC] px-3 py-1 text-[11px] font-extrabold text-[#334155]">
                                  {attendance.completedAt ? "Finalizado" : "Em andamento"}
                                </span>
                              </div>

                              <div className="mt-4 space-y-4">
                                <div>
                                  <p className="text-[11px] font-extrabold uppercase tracking-[0.03em] text-[#64748B]">Avaliação</p>
                                  <p className="mt-1 text-[13px] leading-5 text-[#0F172A]">
                                    {safeText(attendance.assessment, "Nenhuma avaliação registrada.")}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] font-extrabold uppercase tracking-[0.03em] text-[#64748B]">Plano</p>
                                  <p className="mt-1 text-[13px] leading-5 text-[#0F172A]">
                                    {safeText(attendance.plan, "Nenhum plano registrado.")}
                                  </p>
                                </div>

                                {attendance.cidCodes.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {attendance.cidCodes.map((code) => (
                                      <span
                                        key={`${attendance.id}-${code}`}
                                        className="inline-flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[11px] font-bold text-[#0F172A]"
                                      >
                                        {cidLabel(code)}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}

                                {attendance.medications.length ||
                                attendance.procedures.length ||
                                attendance.observationPrescriptions.length ||
                                attendance.recipes.length ? (
                                  <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-[0.03em] text-[#64748B]">Condutas registradas</p>
                                    <div className="mt-2 space-y-2">
                                      {attendance.medications.map((item) => (
                                        <p key={`${attendance.id}-med-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Medicamento: {item.medicationName} — {item.dosage}
                                        </p>
                                      ))}
                                      {attendance.procedures.map((item) => (
                                        <p key={`${attendance.id}-proc-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Procedimento: {item.procedureName}
                                          {item.observations ? ` — ${item.observations}` : ""}
                                        </p>
                                      ))}
                                      {attendance.observationPrescriptions.map((item) => (
                                        <p key={`${attendance.id}-obs-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Observação: {item.title} — {item.description}
                                        </p>
                                      ))}
                                      {attendance.recipes.map((item) => (
                                        <p key={`${attendance.id}-recipe-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Receita {item.recipeType === "ESPECIAL" ? "especial" : "comum"} — {item.text}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {attendance.orientations.length || attendance.certificates.length || attendance.declarations.length ? (
                                  <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-[0.03em] text-[#64748B]">Documentos emitidos</p>
                                    <div className="mt-2 space-y-2">
                                      {attendance.orientations.map((item) => (
                                        <p key={`${attendance.id}-ori-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Orientação: {item.title} — {item.text}
                                        </p>
                                      ))}
                                      {attendance.certificates.map((item) => (
                                        <p key={`${attendance.id}-cert-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Atestado: {item.days} dia(s) a partir de {formatDate(item.startDate)}
                                        </p>
                                      ))}
                                      {attendance.declarations.map((item) => (
                                        <p key={`${attendance.id}-dec-${item.id}`} className="text-[13px] text-[#0F172A]">
                                          Declaração: {item.text}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))
                        : <EmptyCardMessage>Nenhum atendimento registrado.</EmptyCardMessage>
                      : null}

                    {tab === "triages"
                      ? sortedTriages.length > 0
                        ? sortedTriages.map((triage) => (
                            <div key={triage.id} className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#64748B]">
                                  <CalendarDays className="size-4" />
                                  {formatDateTime(triage.triageCompletedAt || triage.triageStartedAt || triage.createdAt)}
                                </div>
                                {riskClassificationToLabel(triage.riskClassification) ? (
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold",
                                      riskBadgeStyles(riskClassificationToLabel(triage.riskClassification))
                                    )}
                                  >
                                    {riskClassificationToLabel(triage.riskClassification)}
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                  { label: "PA", value: safeText(triage.bloodPressure), unit: "mmHg" },
                                  { label: "FC", value: safeText(triage.heartRate), unit: "bpm" },
                                  { label: "FR", value: safeText(triage.respiratoryRate), unit: "rpm" },
                                  { label: "TEMP", value: safeText(triage.temperature), unit: "°C" },
                                  { label: "SAT", value: safeText(triage.oxygenSaturation), unit: "%" },
                                  { label: "GLI", value: safeText(triage.glucose), unit: "mg/dL" },
                                ].map((item) => (
                                  <div key={`${triage.id}-${item.label}`} className="rounded-[10px] bg-[#F8FAFC] p-3">
                                    <p className="text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#64748B]">{item.label}</p>
                                    <div className="mt-2 flex items-baseline gap-1">
                                      <span className="text-[13px] font-bold text-[#0F172A]">{item.value}</span>
                                      <span className="text-[11px] text-[#64748B]">{item.unit}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <p className="mt-4 text-[13px] italic text-[#52627A]">
                                "{safeText(triage.observations, "Sem observações registradas.")}"
                              </p>
                            </div>
                          ))
                        : <EmptyCardMessage>Nenhuma triagem registrada.</EmptyCardMessage>
                      : null}

                    {tab === "prescriptions"
                      ? prescriptionItems.length > 0
                        ? prescriptionItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-white p-4">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#2563EB]">
                                <Syringe className="size-4" />
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-[#0F172A]">{item.label}</p>
                                <p className="text-[13px] text-[#64748B]">{formatDate(item.date)}</p>
                              </div>
                            </div>
                          ))
                        : <EmptyCardMessage>Nenhuma prescrição registrada.</EmptyCardMessage>
                      : null}

                    {tab === "exams"
                      ? examItems.length > 0
                        ? examItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E2E8F0] bg-white p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#9333EA]">
                                  <TestTube2 className="size-4" />
                                </div>
                                <div>
                                  <p className="text-[14px] font-semibold text-[#0F172A]">{item.label}</p>
                                  <p className="text-[13px] text-[#64748B]">{formatDate(item.date)}</p>
                                </div>
                              </div>
                              <span className="inline-flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[11px] font-extrabold text-[#334155]">
                                Solicitado
                              </span>
                            </div>
                          ))
                        : <EmptyCardMessage>Nenhum exame registrado.</EmptyCardMessage>
                      : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="surface-card rounded-[14px] p-4">
                  <SectionHeader icon={AlertTriangle} title="Alergias" tone="red" />
                  <div className="mt-4 space-y-3">
                    {normalizedAllergies.length > 0 ? (
                      normalizedAllergies.map((allergy) => (
                        <div key={allergy.id} className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[14px] font-extrabold text-[#991B1B]">{allergy.title}</p>
                              <p className="mt-1 text-[12px] text-[#DC2626]">{safeText(allergy.type, "Não informado")}</p>
                            </div>
                            {allergy.severity ? (
                              <span className="inline-flex rounded-full border border-[#FCA5A5] bg-white px-2 py-1 text-[10px] font-extrabold text-[#DC2626]">
                                {allergy.severity}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyCardMessage>Nenhuma alergia registrada.</EmptyCardMessage>
                    )}
                  </div>
                </div>

                <div className="surface-card rounded-[14px] p-4">
                  <SectionHeader icon={Syringe} title="Vacinas" tone="blue" />
                  <div className="mt-4 space-y-3">
                    {normalizedVaccines.length > 0 ? (
                      normalizedVaccines.map((vaccine) => (
                        <div key={vaccine.id} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-bold text-[#0F172A]">{vaccine.name}</p>
                            {vaccine.applicationDate ? (
                              <p className="text-[12px] text-[#64748B]">{formatDate(vaccine.applicationDate)}</p>
                            ) : null}
                          </div>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold",
                              vaccineStatusStyles(vaccine.status)
                            )}
                          >
                            {vaccine.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <EmptyCardMessage>Nenhuma vacina registrada.</EmptyCardMessage>
                    )}
                  </div>
                </div>

                <div className="surface-card rounded-[14px] p-4">
                  <SectionHeader icon={CalendarDays} title="Linha do Tempo" tone="blue" />
                  <div className="mt-4 space-y-0">
                    {sortedTimeline.length > 0 ? (
                      sortedTimeline.map((event, index) => {
                        const tone = timelineTone(event.type);

                        return (
                          <div key={`${event.id}-${event.createdAt}`} className="relative flex gap-4 pb-5 last:pb-0">
                            <div className="relative flex w-4 justify-center">
                              <span className={cn("relative z-10 mt-1 block size-3 rounded-full", tone.dot)} />
                              {index < sortedTimeline.length - 1 ? (
                                <span className={cn("absolute left-1/2 top-4 h-full w-px -translate-x-1/2", tone.line)} />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-[#64748B]">{formatDateTime(event.createdAt)}</p>
                              <p className="text-[13px] font-extrabold text-[#0F172A]">{event.title}</p>
                              {event.description ? <p className="text-[12px] text-[#52627A]">{event.description}</p> : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <EmptyCardMessage>Nenhum evento registrado.</EmptyCardMessage>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/patients/${record.patientId}/timeline`}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-[#006EEB] hover:underline"
                    >
                      Ver timeline completa
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="surface-card rounded-[14px] p-4">
                  <SectionHeader icon={Phone} title="Contato" tone="blue" />
                  <div className="mt-4 space-y-3 text-[13px] text-[#0F172A]">
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 size-4 text-[#64748B]" />
                      <span>{record.patientPhone ? formatPhone(record.patientPhone) : "Não informado"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 size-4 text-[#64748B]" />
                      <span>Mãe: Não informado</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 text-[#64748B]" />
                      <span>{hasText(patient?.address) ? patient?.address : municipality}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
