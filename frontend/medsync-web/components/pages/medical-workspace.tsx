"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Printer, Save, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MaskedInput } from "@/components/form/masked-input";
import { ActionListCard, PatientInfoStrip, RiskPill, StatusPill } from "@/components/medsync-primitives";
import { MedicalConductModal } from "@/components/medical-conduct-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapMedicalConductsToPayload, mapMedicalFormToPayload } from "@/lib/form-mappers";
import { formatCns, formatCpf, formatInteger, formatPhone } from "@/lib/input-masks";
import { sanitizeInteger, sanitizeProcedureCode, sanitizeText } from "@/lib/input-sanitizers";
import { validateRequiredText } from "@/lib/input-validators";
import type {
  AmbulatoryAttendanceResponse,
  CertificateConduct,
  DeclarationConduct,
  ExamConduct,
  MedicalConductStatus,
  MedicalConductsState,
  MedicationConduct,
  ObservationPrescriptionConduct,
  OrientationConduct,
  PatientAllergyResponse,
  PatientVaccineResponse,
  ProcedureConduct,
  RecipeConduct,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { finishMedical, getAmbulatoryAttendance } from "@/services/ambulatory";
import { getClinicalSummary } from "@/services/medical-records";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";
import { riskClassificationToLabel, vaccineStatusApiToLabel } from "@/services/triage";

const UNIT_NAME = "HOSP. MUN. MONSENHOR DOURADO";

const medicalActions = [
  "Prescrever medicamento",
  "Prescrever procedimento",
  "Prescrever para observação",
  "Solicitar exame",
  "Emitir orientação",
  "Emitir atestado",
  "Emitir declaração",
  "Emitir receita",
] as const;

type MedicalWorkspaceProps = {
  attendanceId: string;
};

type MedicalActionLabel = (typeof medicalActions)[number];
type MedicalActionId =
  | "medication"
  | "procedure"
  | "observation"
  | "exam"
  | "orientation"
  | "certificate"
  | "declaration"
  | "recipe";

type CidOption = {
  code: string;
  description: string;
};

type ToastState = {
  title: string;
  message: string;
};

type FormState = {
  assessment: string;
  plan: string;
  procedureCode: string;
  selectedCids: CidOption[];
  notifications: string;
  accidentMoto: boolean;
  accidentCarro: boolean;
  accidentBicicleta: boolean;
  accidentPedestre: boolean;
  accidentOutros: boolean;
};

const defaultCidSuggestions: CidOption[] = [
  { code: "J00", description: "Resfriado comum" },
  { code: "R50", description: "Febre" },
  { code: "I10", description: "Hipertensão essencial" },
  { code: "E11", description: "Diabetes mellitus tipo 2" },
];

const emptyConductsState: MedicalConductsState = {
  medications: [],
  procedures: [],
  observationPrescriptions: [],
  exams: [],
  orientations: [],
  certificates: [],
  declarations: [],
  recipes: [],
};

const emptyFormState: FormState = {
  assessment: "",
  plan: "",
  procedureCode: "0301060096",
  selectedCids: [],
  notifications: "Pesquisar...",
  accidentMoto: false,
  accidentCarro: false,
  accidentBicicleta: false,
  accidentPedestre: false,
  accidentOutros: false,
};

function hasValue(value?: string | number | boolean | null) {
  if (typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return !Number.isNaN(value);
  }

  return Boolean(String(value ?? "").trim());
}

function fallbackValue(value?: string | number | null, suffix?: string) {
  if (!hasValue(value)) {
    return "Não informado";
  }

  return suffix ? `${value} ${suffix}` : String(value);
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
    timeStyle: "short",
  }).format(parsed);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function parseDecimal(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = Number.parseFloat(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : null;
}

function bmiLabel(value?: string | null) {
  const bmi = parseDecimal(value);
  if (bmi == null) {
    return "IMC não informado";
  }

  if (bmi < 18.5) return `IMC ${value} · Baixo peso`;
  if (bmi < 25) return `IMC ${value} · Normal`;
  if (bmi < 30) return `IMC ${value} · Sobrepeso`;
  return `IMC ${value} · Obesidade`;
}

function queueStatusLabel(status: AmbulatoryAttendanceResponse["status"]) {
  switch (status) {
    case "AGUARDANDO_TRIAGEM":
      return "Aguardando triagem";
    case "EM_TRIAGEM":
      return "Em triagem";
    case "AGUARDANDO_MEDICO":
      return "Aguardando médico";
    case "EM_ATENDIMENTO_MEDICO":
      return "Em atendimento médico";
    case "FINALIZADO":
      return "Finalizado";
    default:
      return "Não informado";
  }
}

function queueStatusTone(status: AmbulatoryAttendanceResponse["status"]) {
  switch (status) {
    case "FINALIZADO":
      return "green";
    case "EM_TRIAGEM":
    case "EM_ATENDIMENTO_MEDICO":
      return "blue";
    case "AGUARDANDO_TRIAGEM":
    case "AGUARDANDO_MEDICO":
    default:
      return "slate";
  }
}

function normalizeVaccineStatus(status?: string | null) {
  if (!status) {
    return "Não informado";
  }

  if (status === "Em dia" || status === "Pendente" || status === "Desconhecido") {
    return status;
  }

  return vaccineStatusApiToLabel(status);
}

function vaccineTone(status?: string | null) {
  const normalized = normalizeVaccineStatus(status);
  if (normalized === "Em dia") return "green";
  if (normalized === "Pendente") return "red";
  if (normalized === "Desconhecido") return "slate";
  return "blue";
}

function compactAllergySummary(allergy: PatientAllergyResponse) {
  const parts = [allergy.description || allergy.type, allergy.severity || null].filter(Boolean);
  return parts.join(" — ");
}

function nowIso() {
  return new Date().toISOString();
}

function toInputDate(value = nowIso()) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function toInputDateTime(value = nowIso()) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return toInputDateTime(nowIso());
  }

  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function localDateTimeToIso(value: string) {
  if (!value) {
    return nowIso();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatConductStatus(status: MedicalConductStatus) {
  switch (status) {
    case "SALVO":
      return "Salvo";
    case "REALIZADO":
      return "Realizado";
    case "SOLICITADO":
      return "Solicitado";
    case "NAO_SALVO":
    default:
      return "Não salvo";
  }
}

function persistedStatus(status: MedicalConductStatus, fallback: MedicalConductStatus) {
  if (status === "REALIZADO") {
    return "REALIZADO";
  }

  if (status === "SOLICITADO") {
    return "SOLICITADO";
  }

  return fallback;
}

function normalizeConductsForSave(conducts: MedicalConductsState): MedicalConductsState {
  return {
    medications: conducts.medications.map((item) => ({ ...item, status: persistedStatus(item.status, "SALVO") })),
    procedures: conducts.procedures.map((item) => ({ ...item, status: persistedStatus(item.status, "SALVO") })),
    observationPrescriptions: conducts.observationPrescriptions.map((item) => ({
      ...item,
      status: persistedStatus(item.status, "SALVO"),
    })),
    exams: conducts.exams.map((item) => ({ ...item, status: persistedStatus(item.status, "SOLICITADO") })),
    orientations: conducts.orientations.map((item) => ({ ...item, status: persistedStatus(item.status, "SALVO") })),
    certificates: conducts.certificates.map((item) => ({ ...item, status: persistedStatus(item.status, "SALVO") })),
    declarations: conducts.declarations.map((item) => ({ ...item, status: persistedStatus(item.status, "SALVO") })),
    recipes: conducts.recipes.map((item) => ({ ...item, status: persistedStatus(item.status, "SALVO") })),
  };
}

function actionLabelToId(label: MedicalActionLabel): MedicalActionId {
  switch (label) {
    case "Prescrever medicamento":
      return "medication";
    case "Prescrever procedimento":
      return "procedure";
    case "Prescrever para observação":
      return "observation";
    case "Solicitar exame":
      return "exam";
    case "Emitir orientação":
      return "orientation";
    case "Emitir atestado":
      return "certificate";
    case "Emitir declaração":
      return "declaration";
    case "Emitir receita":
    default:
      return "recipe";
  }
}

function buildCertificateText(attendance: AmbulatoryAttendanceResponse, issueDate: string, startDate: string, days: number) {
  return sanitizeText(
    `Atesto, para os devidos fins, que ${attendance.patientName}, CPF: ${formatCpf(attendance.patientCpf)}, recebeu atendimento no ${UNIT_NAME} no dia ${formatDate(issueDate)}. Em decorrência, deverá permanecer em afastamento de suas atividades por um período de ${days} dia(s) a partir do dia ${formatDate(startDate)}.`,
    2000
  );
}

function buildDeclarationText(attendance: AmbulatoryAttendanceResponse, startDateTime: string, endDateTime: string) {
  return sanitizeText(
    `Declaro que o(a) ${attendance.patientName}, permaneceu no Hospital no dia ${formatDateTime(
      localDateTimeToIso(startDateTime)
    )} até o dia ${formatDateTime(localDateTimeToIso(endDateTime))}.`,
    2000
  );
}

function ModalFieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-[#0F172A]">{children}</label>;
}

function StatusBadge({ status }: { status: MedicalConductStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status === "SALVO" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "REALIZADO" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "SOLICITADO" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "NAO_SALVO" && "border-slate-200 bg-slate-50 text-slate-700"
      )}
    >
      {formatConductStatus(status)}
    </span>
  );
}

function ToastCard({ toast }: { toast: ToastState }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
      <p className="text-base font-semibold text-[#0F172A]">{toast.title}</p>
      <p className="mt-2 text-sm text-[#52627A]">{toast.message}</p>
    </div>
  );
}

export function MedicalWorkspace({ attendanceId }: MedicalWorkspaceProps) {
  const router = useRouter();
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [attendance, setAttendance] = useState<AmbulatoryAttendanceResponse | null>(null);
  const [patientAllergies, setPatientAllergies] = useState<PatientAllergyResponse[]>([]);
  const [patientVaccines, setPatientVaccines] = useState<PatientVaccineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeAction, setActiveAction] = useState<MedicalActionId | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conducts, setConducts] = useState<MedicalConductsState>(emptyConductsState);
  const [cidQuery, setCidQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyFormState);

  const [medicationDraft, setMedicationDraft] = useState({
    medicationName: "",
    protocol: "",
    scheduledAt: toInputDateTime(),
    dosage: "",
  });
  const [procedureDraft, setProcedureDraft] = useState({
    procedureName: "",
    protocol: "",
    scheduledAt: toInputDateTime(),
    observations: "",
  });
  const [observationDraft, setObservationDraft] = useState({
    title: "",
    description: "",
    observationTime: "",
  });
  const [examDraft, setExamDraft] = useState({
    examName: "",
    protocol: "",
    observations: "",
  });
  const [orientationDraft, setOrientationDraft] = useState({
    title: "",
    text: "",
  });
  const [certificateDraft, setCertificateDraft] = useState({
    issueDate: toInputDate(),
    startDate: toInputDate(),
    days: "1",
    text: "",
    includeCidCode: false,
    includeCidDescription: false,
  });
  const [declarationDraft, setDeclarationDraft] = useState({
    startDateTime: toInputDateTime(),
    endDateTime: toInputDateTime(),
    text: "",
  });
  const [recipeDraft, setRecipeDraft] = useState({
    fillMode: "PADRAO" as RecipeConduct["fillMode"],
    recipeType: "COMUM" as RecipeConduct["recipeType"],
    favoriteName: "",
    text: "",
    saveAsFavorite: false,
  });
  const [procedureSelection, setProcedureSelection] = useState<string[]>([]);
  const [conductError, setConductError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAmbulatoryAttendance(attendanceId, { demo: forceDemo });
        let summary = null;
        try {
          summary = await getClinicalSummary(data.patientId, { demo: forceDemo });
        } catch (summaryError) {
          if (!forceDemo && isDemoModeEnabled()) {
            summary = await getClinicalSummary(data.patientId, { demo: true });
            if (mounted) {
              setForceDemo(true);
            }
          } else {
            throw summaryError;
          }
        }

        const record = summary?.record || null;
        const latestMedical = record?.medicalAttendances[0] || null;

        if (!mounted) {
          return;
        }

        setAttendance(data);
        setPatientAllergies(summary?.allergies || []);
        setPatientVaccines(summary?.vaccines || []);
        const selectedCids = (latestMedical?.cidCodes || []).map((code) => {
          const match = defaultCidSuggestions.find((item) => item.code === code);
          return match || { code, description: "Diagnóstico selecionado" };
        });
        setForm({
          assessment: latestMedical?.assessment || "",
          plan: latestMedical?.plan || "",
          procedureCode: latestMedical?.procedureCode || "0301060096",
          selectedCids,
          notifications: latestMedical?.notifications || "Pesquisar...",
          accidentMoto: latestMedical?.accidentMoto || false,
          accidentCarro: latestMedical?.accidentCarro || false,
          accidentBicicleta: latestMedical?.accidentBicicleta || false,
          accidentPedestre: latestMedical?.accidentPedestre || false,
          accidentOutros: latestMedical?.accidentOutros || false,
        });
        setConducts(
          latestMedical
            ? {
                medications: latestMedical.medications || [],
                procedures: latestMedical.procedures || [],
                observationPrescriptions: latestMedical.observationPrescriptions || [],
                exams: latestMedical.exams || [],
                orientations: latestMedical.orientations || [],
                certificates: latestMedical.certificates || [],
                declarations: latestMedical.declarations || [],
                recipes: latestMedical.recipes || [],
              }
            : emptyConductsState
        );
        setCidQuery("");
      } catch (rawError) {
        if (!mounted) {
          return;
        }

        setError(getServiceErrorMessage(rawError, "Não foi possível carregar o atendimento médico."));
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
  }, [attendanceId, forceDemo]);

  useEffect(() => {
    if (!attendance) {
      return;
    }

    setCertificateDraft((current) => ({
      ...current,
      text: current.text || buildCertificateText(attendance, current.issueDate, current.startDate, Number(current.days) || 1),
    }));
    setDeclarationDraft((current) => ({
      ...current,
      text: current.text || buildDeclarationText(attendance, current.startDateTime, current.endDateTime),
    }));
  }, [attendance]);

  const cidSuggestions = useMemo(() => {
    const normalized = cidQuery.trim().toLowerCase();
    if (!normalized) {
      return defaultCidSuggestions;
    }

    return defaultCidSuggestions.filter((cid) => `${cid.code} ${cid.description}`.toLowerCase().includes(normalized));
  }, [cidQuery]);

  const allergyItems = useMemo(
    () =>
      patientAllergies.filter(
        (allergy) => hasValue(allergy.type) || hasValue(allergy.description) || hasValue(allergy.severity)
      ),
    [patientAllergies]
  );

  const displayedVaccines = useMemo(
    () => patientVaccines.filter((vaccine) => hasValue(vaccine.name) && hasValue(vaccine.status)),
    [patientVaccines]
  );

  const vitalSigns = useMemo(
    () => [
      { label: "Peso", value: fallbackValue(attendance?.weightKg, "kg") },
      { label: "Pressão arterial", value: fallbackValue(attendance?.bloodPressure) },
      { label: "Saturação O2", value: fallbackValue(attendance?.oxygenSaturation, "%") },
      { label: "Temperatura", value: fallbackValue(attendance?.temperature, "°C") },
      { label: "Glicemia", value: fallbackValue(attendance?.glucose, "mg/dL") },
      { label: "Freq. cardíaca", value: fallbackValue(attendance?.heartRate, "bpm") },
      ...(hasValue(attendance?.heightCm) ? [{ label: "Altura", value: fallbackValue(attendance?.heightCm, "cm") }] : []),
      ...(hasValue(attendance?.respiratoryRate)
        ? [{ label: "Freq. respiratória", value: fallbackValue(attendance?.respiratoryRate, "irpm") }]
        : []),
      ...(hasValue(attendance?.bmi) ? [{ label: "IMC", value: fallbackValue(attendance?.bmi) }] : []),
      ...(hasValue(attendance?.painLevel) ? [{ label: "Dor", value: fallbackValue(attendance?.painLevel, "/10") }] : []),
      ...(hasValue(attendance?.abdominalCircumference)
        ? [{ label: "Circ. abdominal", value: fallbackValue(attendance?.abdominalCircumference, "cm") }]
        : []),
    ],
    [attendance]
  );

  function notify(title: string, message: string) {
    setToast({ title, message });
  }

  function openAction(label: string) {
    setConductError(null);
    setActiveAction(actionLabelToId(label as MedicalActionLabel));
  }

  function closeAction() {
    setConductError(null);
    setActiveAction(null);
  }

  function addCid(option: CidOption) {
    setForm((current) => {
      if (current.selectedCids.some((item) => item.code === option.code)) {
        return current;
      }

      return { ...current, selectedCids: [...current.selectedCids, option] };
    });
    setCidQuery("");
  }

  function removeCid(code: string) {
    setForm((current) => ({
      ...current,
      selectedCids: current.selectedCids.filter((item) => item.code !== code),
    }));
  }

  function removeConduct<T extends keyof MedicalConductsState>(key: T, id: string) {
    setConducts((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }));
    notify("Sucesso", "Item removido.");
  }

  function addMedication() {
    const medicationName = sanitizeText(medicationDraft.medicationName, 120);
    const dosage = sanitizeText(medicationDraft.dosage, 500);
    if (!medicationName) {
      setConductError("Informe o nome do medicamento.");
      return;
    }
    if (!dosage) {
      setConductError("Informe a posologia do medicamento.");
      return;
    }

    const item: MedicationConduct = {
      id: createLocalId("med"),
      medicationName,
      protocol: sanitizeText(medicationDraft.protocol, 120),
      scheduledAt: localDateTimeToIso(medicationDraft.scheduledAt),
      dosage,
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, medications: [item, ...current.medications] }));
    setMedicationDraft({ medicationName: "", protocol: "", scheduledAt: toInputDateTime(), dosage: "" });
    setConductError(null);
    notify("Sucesso", "Medicamento adicionado à prescrição.");
  }

  function addProcedure() {
    const procedureName = sanitizeText(procedureDraft.procedureName, 120);
    if (!procedureName) {
      setConductError("Informe o nome do procedimento.");
      return;
    }

    const item: ProcedureConduct = {
      id: createLocalId("proc"),
      procedureName,
      protocol: sanitizeText(procedureDraft.protocol, 120),
      scheduledAt: localDateTimeToIso(procedureDraft.scheduledAt),
      observations: sanitizeText(procedureDraft.observations, 500),
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, procedures: [item, ...current.procedures] }));
    setProcedureDraft({ procedureName: "", protocol: "", scheduledAt: toInputDateTime(), observations: "" });
    setConductError(null);
    notify("Sucesso", "Procedimento adicionado à prescrição.");
  }

  function addObservationPrescription() {
    const title = sanitizeText(observationDraft.title, 120);
    const description = sanitizeText(observationDraft.description, 1000);
    if (!title) {
      setConductError("Informe o título da observação.");
      return;
    }
    if (!description) {
      setConductError("Informe a descrição da observação.");
      return;
    }

    const item: ObservationPrescriptionConduct = {
      id: createLocalId("obs"),
      title,
      description,
      observationTime: sanitizeText(observationDraft.observationTime, 120),
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({
      ...current,
      observationPrescriptions: [item, ...current.observationPrescriptions],
    }));
    setObservationDraft({ title: "", description: "", observationTime: "" });
    setConductError(null);
    notify("Sucesso", "Prescrição para observação adicionada.");
  }

  function addExam() {
    const examName = sanitizeText(examDraft.examName, 120);
    if (!examName) {
      setConductError("Informe o nome do exame.");
      return;
    }

    const item: ExamConduct = {
      id: createLocalId("exam"),
      examName,
      protocol: sanitizeText(examDraft.protocol, 120),
      observations: sanitizeText(examDraft.observations, 500),
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, exams: [item, ...current.exams] }));
    setExamDraft({ examName: "", protocol: "", observations: "" });
    setConductError(null);
    notify("Sucesso", "Exame adicionado à solicitação.");
  }

  function addOrientation() {
    const title = sanitizeText(orientationDraft.title, 120);
    const text = sanitizeText(orientationDraft.text, 2000);
    if (!title) {
      setConductError("Informe o título da orientação.");
      return;
    }
    if (!text) {
      setConductError("Informe a orientação ao paciente.");
      return;
    }

    const item: OrientationConduct = {
      id: createLocalId("ori"),
      title,
      text,
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, orientations: [item, ...current.orientations] }));
    setOrientationDraft({ title: "", text: "" });
    setConductError(null);
    notify("Sucesso", "Orientação salva.");
  }

  function addCertificate() {
    const days = Number(sanitizeInteger(certificateDraft.days, { maxDigits: 3 }) || "0");
    const text = sanitizeText(certificateDraft.text, 2000);

    if (days < 1) {
      setConductError("Informe uma quantidade de dias válida.");
      return;
    }
    if (!text) {
      setConductError("Informe o texto do atestado.");
      return;
    }

    const item: CertificateConduct = {
      id: createLocalId("cert"),
      issueDate: certificateDraft.issueDate,
      startDate: certificateDraft.startDate,
      days,
      text,
      includeCidCode: certificateDraft.includeCidCode,
      includeCidDescription: certificateDraft.includeCidDescription,
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, certificates: [item, ...current.certificates] }));
    if (attendance) {
      setCertificateDraft({
        issueDate: toInputDate(),
        startDate: toInputDate(),
        days: "1",
        text: buildCertificateText(attendance, toInputDate(), toInputDate(), 1),
        includeCidCode: false,
        includeCidDescription: false,
      });
    }
    setConductError(null);
    notify("Sucesso", "Atestado salvo.");
  }

  function addDeclaration() {
    const text = sanitizeText(declarationDraft.text, 2000);
    if (!declarationDraft.startDateTime || !declarationDraft.endDateTime) {
      setConductError("Informe as datas da declaração.");
      return;
    }
    if (new Date(declarationDraft.endDateTime).getTime() < new Date(declarationDraft.startDateTime).getTime()) {
      setConductError("A data final da declaração não pode ser menor que a inicial.");
      return;
    }
    if (!text) {
      setConductError("Informe o texto da declaração.");
      return;
    }

    const item: DeclarationConduct = {
      id: createLocalId("dec"),
      startDateTime: localDateTimeToIso(declarationDraft.startDateTime),
      endDateTime: localDateTimeToIso(declarationDraft.endDateTime),
      text,
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, declarations: [item, ...current.declarations] }));
    if (attendance) {
      const startDateTime = toInputDateTime();
      const endDateTime = toInputDateTime();
      setDeclarationDraft({
        startDateTime,
        endDateTime,
        text: buildDeclarationText(attendance, startDateTime, endDateTime),
      });
    }
    setConductError(null);
    notify("Sucesso", "Declaração salva.");
  }

  function addRecipe() {
    const text = sanitizeText(recipeDraft.text, 3000);
    if (!text) {
      setConductError("Informe o conteúdo da receita.");
      return;
    }

    const item: RecipeConduct = {
      id: createLocalId("recipe"),
      fillMode: recipeDraft.fillMode,
      recipeType: recipeDraft.recipeType,
      favoriteName: sanitizeText(recipeDraft.favoriteName, 120),
      text,
      saveAsFavorite: recipeDraft.saveAsFavorite,
      status: "NAO_SALVO",
      createdAt: nowIso(),
    };

    setConducts((current) => ({ ...current, recipes: [item, ...current.recipes] }));
    setRecipeDraft({
      fillMode: "PADRAO",
      recipeType: "COMUM",
      favoriteName: "",
      text: "",
      saveAsFavorite: false,
    });
    setConductError(null);
    notify("Sucesso", "Receita salva.");
  }

  function realizeSelectedProcedures() {
    if (procedureSelection.length === 0) {
      setConductError("Selecione ao menos um procedimento para marcar como realizado.");
      return;
    }

    setConducts((current) => ({
      ...current,
      procedures: current.procedures.map((item) =>
        procedureSelection.includes(item.id) ? { ...item, status: "REALIZADO" } : item
      ),
    }));
    setProcedureSelection([]);
    setConductError(null);
    notify("Sucesso", "Procedimentos selecionados marcados como realizados.");
  }

  function handlePrintFallback() {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
      return;
    }

    notify("Aviso", "Impressão não disponível neste ambiente.");
  }

  async function handleSubmit() {
    if (!attendance) {
      return;
    }

    const nextErrors: Record<string, string> = {};
    const assessmentError = validateRequiredText(form.assessment, {
      min: 5,
      message: "Informe a avaliação clínica.",
    });
    const planError = validateRequiredText(form.plan, {
      min: 5,
      message: "Informe o plano/conduta.",
    });

    if (assessmentError) nextErrors.assessment = assessmentError;
    if (planError) nextErrors.plan = planError;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Corrija os campos destacados antes de finalizar o atendimento.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = mapMedicalFormToPayload({
        ...form,
        cidCodes: form.selectedCids.map((item) => item.code),
      });
      const persistedConducts = normalizeConductsForSave(conducts);
      setConducts(persistedConducts);

      await finishMedical(
        attendance.id,
        {
          ...payload,
          ...mapMedicalConductsToPayload(persistedConducts),
          professionalName: "Equipe médica",
        },
        { demo: forceDemo }
      );

      notify("Sucesso", "Atendimento finalizado com condutas registradas.");
      router.push(`/patients/${attendance.patientId}/record`);
    } catch (rawError) {
      setError(getServiceErrorMessage(rawError, "Não foi possível finalizar o atendimento médico."));
    } finally {
      setSaving(false);
    }
  }

  const medicationFooter = (
    <>
      <Button variant="outline" onClick={handlePrintFallback} disabled={conducts.medications.length === 0}>
        Imprimir 2ª via
      </Button>
      <Button onClick={closeAction} disabled={conducts.medications.length === 0}>
        <Save className="mr-2 size-4" />
        Salvar &amp; Imprimir
      </Button>
    </>
  );

  const procedureFooter = (
    <>
      <Button variant="outline" onClick={realizeSelectedProcedures} disabled={conducts.procedures.length === 0}>
        <CheckCircle2 className="mr-2 size-4" />
        Realizar selecionados
      </Button>
      <Button variant="outline" onClick={handlePrintFallback} disabled={conducts.procedures.length === 0}>
        <Printer className="mr-2 size-4" />
        Imprimir 2ª via
      </Button>
      <Button onClick={closeAction} disabled={conducts.procedures.length === 0}>
        <Save className="mr-2 size-4" />
        Salvar &amp; Imprimir
      </Button>
    </>
  );

  const examFooter = (
    <Button onClick={closeAction} disabled={conducts.exams.length === 0}>
      <Save className="mr-2 size-4" />
      Salvar &amp; Imprimir
    </Button>
  );

  return (
    <AppShell
      title="Atendimento Médico"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Ambulatorial", href: "/ambulatorial" },
        { label: "Fila de Atendimento", href: "/fila-atendimento" },
        { label: "Atendimento Médico" },
      ]}
    >
      <div className="space-y-4">
        <Link href="/fila-atendimento" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
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

        {loading || !attendance ? (
          <div className="surface-card p-5 text-sm text-muted-foreground">Carregando atendimento médico...</div>
        ) : (
          <>
            <PatientInfoStrip
              items={[
                { label: "Nome do paciente", value: fallbackValue(attendance.patientName) },
                { label: "Idade", value: attendance.patientAge != null ? `${attendance.patientAge} anos` : "Não informado" },
                { label: "CPF", value: attendance.patientCpf ? formatCpf(attendance.patientCpf) : "Não informado" },
                { label: "CNS", value: attendance.patientCns ? formatCns(attendance.patientCns) : "Não informado" },
                { label: "Telefone", value: attendance.patientPhone ? formatPhone(attendance.patientPhone) : "Não informado" },
              ]}
            />

            <div className="grid gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#64748B] md:grid-cols-[1fr_160px_1fr] md:items-center">
              <span>Acolhimento/Classificação de risco</span>
              <div className="relative hidden h-px bg-border md:block">
                <span className="absolute -left-1 top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary" />
                <span className="absolute -right-1 top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary" />
              </div>
              <span className="text-right">Atendimento Médico</span>
            </div>

            <div className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#EEF4FF] text-primary">
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-foreground">Acolhimento do Paciente</p>
                      <StatusPill tone="blue">{bmiLabel(attendance.bmi)}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Resumo clínico do acolhimento antes da avaliação médica.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <RiskPill level={riskClassificationToLabel(attendance.riskClassification)} compact />
                  <StatusPill tone={queueStatusTone(attendance.status)}>{queueStatusLabel(attendance.status)}</StatusPill>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  {vitalSigns.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-[#F8FAFC] px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">{item.label}</p>
                      <p className="mt-1.5 text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
                  <div className="rounded-xl border border-border bg-[#F8FAFC] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Alergias</p>
                    {allergyItems.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">Nenhuma alergia informada.</p>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        {allergyItems.map((allergy, index) => (
                          <p key={`${allergy.id}-${index}`} className="text-sm text-foreground">
                            {compactAllergySummary(allergy)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-[#F8FAFC] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Vacinas</p>
                    {displayedVaccines.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">Nenhuma vacina registrada.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {displayedVaccines.map((vaccine) => (
                          <div key={vaccine.id} className="flex items-center justify-between gap-2">
                            <span className="text-sm text-foreground">{vaccine.name}</span>
                            <StatusPill tone={vaccineTone(vaccine.status)}>{normalizeVaccineStatus(vaccine.status)}</StatusPill>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-[#F8FAFC] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Observações</p>
                        <p className="mt-2 text-sm text-foreground">{attendance.observations || "Sem observações."}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Destino</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{fallbackValue(attendance.destination)}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(attendance.triageCompletedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <div className="surface-card p-5">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="field-label">Avaliação (obrigatório)</label>
                      <Textarea
                        value={form.assessment}
                        onChange={(event) => {
                          setFieldErrors((current) => ({ ...current, assessment: "" }));
                          setForm((current) => ({ ...current, assessment: sanitizeText(event.target.value, 2000) }));
                        }}
                        maxLength={2000}
                        placeholder="Digite algo..."
                        className="min-h-[92px]"
                      />
                      {fieldErrors.assessment ? <p className="text-sm text-destructive">{fieldErrors.assessment}</p> : null}
                    </div>

                    <div className="grid gap-2">
                      <label className="field-label">Plano (obrigatório)</label>
                      <Textarea
                        value={form.plan}
                        onChange={(event) => {
                          setFieldErrors((current) => ({ ...current, plan: "" }));
                          setForm((current) => ({ ...current, plan: sanitizeText(event.target.value, 2000) }));
                        }}
                        maxLength={2000}
                        placeholder="Digite algo..."
                        className="min-h-[92px]"
                      />
                      {fieldErrors.plan ? <p className="text-sm text-destructive">{fieldErrors.plan}</p> : null}
                    </div>

                    <div className="grid gap-2">
                      <label className="field-label">Procedimentos Administrativos (SIGTAP)</label>
                      <MaskedInput
                        value={form.procedureCode}
                        onChange={(value) => setForm((current) => ({ ...current, procedureCode: value }))}
                        sanitizer={sanitizeProcedureCode}
                        mask={(value) => formatInteger(value, { maxDigits: 10 })}
                        maxLength={10}
                        inputMode="numeric"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="field-label">CID-10</label>
                      <Input
                        value={cidQuery}
                        onChange={(event) => setCidQuery(sanitizeText(event.target.value, 80))}
                        maxLength={80}
                        placeholder="Pesquisar CID-10..."
                        className="h-12 rounded-[14px] border border-[#CBD5E1] px-4 text-base"
                      />
                      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                        {cidSuggestions.length > 0 ? (
                          cidSuggestions.map((cid) => (
                            <button
                              key={cid.code}
                              type="button"
                              onClick={() => addCid(cid)}
                              className="flex w-full cursor-pointer items-center gap-3 border-b border-[#EEF2F7] px-4 py-[14px] text-left transition-colors last:border-b-0 hover:bg-[#F8FAFC]"
                            >
                              <span className="text-base font-bold text-[#0F172A]">{cid.code}</span>
                              <span className="text-base font-medium text-[#334155]">{cid.description}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-[14px] text-sm text-muted-foreground">Nenhum CID-10 encontrado.</div>
                        )}
                      </div>
                      <div className="pt-3">
                        <p className="mb-[10px] mt-2 text-sm font-semibold text-[#475569]">CID-10 selecionados</p>
                        {form.selectedCids.length === 0 ? (
                          <p className="text-sm text-[#64748B]">Nenhum CID-10 selecionado.</p>
                        ) : (
                          <div className="flex flex-wrap gap-[10px]">
                            {form.selectedCids.map((cid) => (
                              <span
                                key={cid.code}
                                className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-[#1D4ED8]"
                              >
                                <span className="text-sm font-bold">{cid.code}</span>
                                <span className="text-sm font-medium text-[#1E3A8A]">{cid.description}</span>
                                <button
                                  type="button"
                                  onClick={() => removeCid(cid.code)}
                                  className="flex size-5 items-center justify-center rounded-full text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
                                  aria-label={`Remover CID ${cid.code}`}
                                >
                                  <X className="size-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="field-label">Notificações</label>
                      <Select
                        value={form.notifications}
                        onChange={(event) => setForm((current) => ({ ...current, notifications: event.target.value }))}
                      >
                        <option>Pesquisar...</option>
                        <option>Sinan</option>
                        <option>Notificação interna</option>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <p className="field-label">Em caso de acidente de trânsito, escolha um motivo</p>
                      <div className="flex flex-wrap gap-4 text-sm text-foreground">
                        {[
                          ["Moto", "accidentMoto"],
                          ["Carro", "accidentCarro"],
                          ["Bicicleta", "accidentBicicleta"],
                          ["Pedestre", "accidentPedestre"],
                          ["Outros", "accidentOutros"],
                        ].map(([label, key]) => (
                          <label key={label} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(form[key as keyof FormState])}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  [key]: event.target.checked,
                                }))
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ActionListCard actions={[...medicalActions]} onActionClick={openAction} className="w-full xl:w-[300px]" />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push("/fila-atendimento")} disabled={saving}>
                Voltar
              </Button>
              <Button variant="outline" onClick={() => notify("Aviso", "As condutas serão persistidas ao finalizar o atendimento.")} disabled={saving}>
                Salvar
              </Button>
              <Button variant="destructive" onClick={() => router.push("/fila-atendimento")} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={saving}>
                {saving ? "Finalizando..." : "Finalizar atendimento"}
              </Button>
            </div>
          </>
        )}
      </div>

      {activeAction === "medication" ? (
        <MedicalConductModal title="Prescrever Medicamento" onClose={closeAction} footer={medicationFooter}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <ModalFieldLabel>Medicamento</ModalFieldLabel>
              <Input
                value={medicationDraft.medicationName}
                onChange={(event) => setMedicationDraft((current) => ({ ...current, medicationName: sanitizeText(event.target.value, 120) }))}
                placeholder="Digite o nome do medicamento"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Protocolo</ModalFieldLabel>
              <Input
                value={medicationDraft.protocol}
                onChange={(event) => setMedicationDraft((current) => ({ ...current, protocol: sanitizeText(event.target.value, 120) }))}
                placeholder="Digite o protocolo, se houver"
                className="h-10"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <div className="grid gap-2">
              <ModalFieldLabel>Data para realização</ModalFieldLabel>
              <Input
                type="datetime-local"
                value={medicationDraft.scheduledAt}
                onChange={(event) => setMedicationDraft((current) => ({ ...current, scheduledAt: event.target.value }))}
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Posologia</ModalFieldLabel>
              <Textarea
                value={medicationDraft.dosage}
                onChange={(event) => setMedicationDraft((current) => ({ ...current, dosage: sanitizeText(event.target.value, 500) }))}
                placeholder="Informe dose, frequência, via de administração e duração"
                className="min-h-24"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addMedication}>Prescrever</Button>
          </div>
          {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#0F172A]">Medicamentos prescritos</h3>
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
              <div className="grid grid-cols-[minmax(0,1.2fr)_180px_minmax(0,1.5fr)_110px_90px] gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#52627A]">
                <span>Medicamento</span>
                <span>Realizar às</span>
                <span>Posologia</span>
                <span>Estado</span>
                <span className="text-right">Ações</span>
              </div>
              {conducts.medications.length === 0 ? (
                <p className="px-4 py-4 text-sm text-[#64748B]">Nenhum medicamento adicionado.</p>
              ) : (
                conducts.medications.map((item) => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1.2fr)_180px_minmax(0,1.5fr)_110px_90px] gap-3 border-b border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] last:border-b-0">
                    <div>
                      <p className="font-semibold">{item.medicationName}</p>
                      {item.protocol ? <p className="mt-1 text-xs text-[#64748B]">{item.protocol}</p> : null}
                    </div>
                    <span>{formatDateTime(item.scheduledAt)}</span>
                    <span>{item.dosage}</span>
                    <StatusBadge status={item.status} />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeConduct("medications", item.id)}
                        className="flex size-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] transition-colors hover:bg-[#FECACA]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </MedicalConductModal>
      ) : null}

      {activeAction === "procedure" ? (
        <MedicalConductModal title="Prescrever Procedimento" onClose={closeAction} footer={procedureFooter}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <ModalFieldLabel>Procedimento</ModalFieldLabel>
              <Input
                value={procedureDraft.procedureName}
                onChange={(event) => setProcedureDraft((current) => ({ ...current, procedureName: sanitizeText(event.target.value, 120) }))}
                placeholder="Digite o nome do procedimento"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Protocolo</ModalFieldLabel>
              <Input
                value={procedureDraft.protocol}
                onChange={(event) => setProcedureDraft((current) => ({ ...current, protocol: sanitizeText(event.target.value, 120) }))}
                placeholder="Digite o protocolo, se houver"
                className="h-10"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <div className="grid gap-2">
              <ModalFieldLabel>Data para realização</ModalFieldLabel>
              <Input
                type="datetime-local"
                value={procedureDraft.scheduledAt}
                onChange={(event) => setProcedureDraft((current) => ({ ...current, scheduledAt: event.target.value }))}
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Observações</ModalFieldLabel>
              <Textarea
                value={procedureDraft.observations}
                onChange={(event) => setProcedureDraft((current) => ({ ...current, observations: sanitizeText(event.target.value, 500) }))}
                placeholder="Observações da prescrição"
                className="min-h-24"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addProcedure}>Prescrever</Button>
          </div>
          {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#0F172A]">Procedimentos prescritos</h3>
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
              <div className="grid grid-cols-[40px_minmax(0,1fr)_180px_minmax(0,1.2fr)_110px_90px] gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#52627A]">
                <span />
                <span>Procedimento</span>
                <span>Realizar às</span>
                <span>Observações</span>
                <span>Estado</span>
                <span className="text-right">Ações</span>
              </div>
              {conducts.procedures.length === 0 ? (
                <p className="px-4 py-4 text-sm text-[#64748B]">Nenhum procedimento adicionado.</p>
              ) : (
                conducts.procedures.map((item) => (
                  <div key={item.id} className="grid grid-cols-[40px_minmax(0,1fr)_180px_minmax(0,1.2fr)_110px_90px] gap-3 border-b border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] last:border-b-0">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={procedureSelection.includes(item.id)}
                        onChange={(event) =>
                          setProcedureSelection((current) =>
                            event.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id)
                          )
                        }
                      />
                    </label>
                    <div>
                      <p className="font-semibold">{item.procedureName}</p>
                      {item.protocol ? <p className="mt-1 text-xs text-[#64748B]">{item.protocol}</p> : null}
                    </div>
                    <span>{formatDateTime(item.scheduledAt)}</span>
                    <span>{item.observations || "Sem observações."}</span>
                    <StatusBadge status={item.status} />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeConduct("procedures", item.id)}
                        className="flex size-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] transition-colors hover:bg-[#FECACA]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </MedicalConductModal>
      ) : null}

      {activeAction === "observation" ? (
        <MedicalConductModal
          title="Prescrever para Observação"
          onClose={closeAction}
          footer={<Button onClick={closeAction}>Fechar</Button>}
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <ModalFieldLabel>Título da observação</ModalFieldLabel>
              <Input
                value={observationDraft.title}
                onChange={(event) => setObservationDraft((current) => ({ ...current, title: sanitizeText(event.target.value, 120) }))}
                placeholder="Ex: Observação clínica, hidratação, repouso, monitoramento"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Descrição</ModalFieldLabel>
              <Textarea
                value={observationDraft.description}
                onChange={(event) => setObservationDraft((current) => ({ ...current, description: sanitizeText(event.target.value, 1000) }))}
                placeholder="Descreva a prescrição para observação"
                className="min-h-24"
              />
            </div>
            <div className="grid gap-2 md:max-w-xs">
              <ModalFieldLabel>Tempo de observação</ModalFieldLabel>
              <Input
                value={observationDraft.observationTime}
                onChange={(event) => setObservationDraft((current) => ({ ...current, observationTime: sanitizeText(event.target.value, 120) }))}
                placeholder="Ex: 2 horas, 6 horas, até reavaliação médica"
                className="h-10"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={addObservationPrescription}>Adicionar observação</Button>
            </div>
            {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#0F172A]">Prescrições para observação</h3>
              {conducts.observationPrescriptions.length === 0 ? (
                <p className="text-sm text-[#64748B]">Nenhuma prescrição de observação registrada.</p>
              ) : (
                conducts.observationPrescriptions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{item.title}</p>
                        <p className="mt-2 text-sm text-[#52627A]">{item.description}</p>
                        <p className="mt-2 text-xs text-[#64748B]">{item.observationTime || "Tempo não informado"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeConduct("observationPrescriptions", item.id)}
                        className="flex size-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] transition-colors hover:bg-[#FECACA]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </MedicalConductModal>
      ) : null}

      {activeAction === "exam" ? (
        <MedicalConductModal title="Solicitar Exame" onClose={closeAction} footer={examFooter}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <ModalFieldLabel>Exame</ModalFieldLabel>
              <Input
                value={examDraft.examName}
                onChange={(event) => setExamDraft((current) => ({ ...current, examName: sanitizeText(event.target.value, 120) }))}
                placeholder="Digite o nome do exame"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Protocolo</ModalFieldLabel>
              <Input
                value={examDraft.protocol}
                onChange={(event) => setExamDraft((current) => ({ ...current, protocol: sanitizeText(event.target.value, 120) }))}
                placeholder="Digite o protocolo, se houver"
                className="h-10"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <ModalFieldLabel>Observações</ModalFieldLabel>
            <Textarea
              value={examDraft.observations}
              onChange={(event) => setExamDraft((current) => ({ ...current, observations: sanitizeText(event.target.value, 500) }))}
              placeholder="Observações da solicitação"
              className="min-h-24"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addExam}>Solicitar</Button>
          </div>
          {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#0F172A]">Exames solicitados</h3>
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_110px_90px] gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#52627A]">
                <span>Exame</span>
                <span>Observações</span>
                <span>Estado</span>
                <span className="text-right">Ações</span>
              </div>
              {conducts.exams.length === 0 ? (
                <p className="px-4 py-4 text-sm text-[#64748B]">Nenhum exame adicionado.</p>
              ) : (
                conducts.exams.map((item) => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_110px_90px] gap-3 border-b border-[#E2E8F0] px-4 py-3 text-sm text-[#0F172A] last:border-b-0">
                    <div>
                      <p className="font-semibold">{item.examName}</p>
                      {item.protocol ? <p className="mt-1 text-xs text-[#64748B]">{item.protocol}</p> : null}
                    </div>
                    <span>{item.observations || "Sem observações."}</span>
                    <StatusBadge status={item.status} />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeConduct("exams", item.id)}
                        className="flex size-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] transition-colors hover:bg-[#FECACA]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </MedicalConductModal>
      ) : null}

      {activeAction === "orientation" ? (
        <MedicalConductModal
          title="Emitir Orientação"
          onClose={closeAction}
          footer={<Button onClick={closeAction}>Fechar</Button>}
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <ModalFieldLabel>Título/Tipo da orientação</ModalFieldLabel>
              <Input
                value={orientationDraft.title}
                onChange={(event) => setOrientationDraft((current) => ({ ...current, title: sanitizeText(event.target.value, 120) }))}
                placeholder="Ex: Orientações gerais, retorno, repouso, hidratação"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Orientação</ModalFieldLabel>
              <Textarea
                value={orientationDraft.text}
                onChange={(event) => setOrientationDraft((current) => ({ ...current, text: sanitizeText(event.target.value, 2000) }))}
                placeholder="Descreva a orientação ao paciente"
                className="min-h-32"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={addOrientation}>Salvar</Button>
            </div>
            {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#0F172A]">Orientações emitidas</h3>
              {conducts.orientations.length === 0 ? (
                <p className="text-sm text-[#64748B]">Nenhuma orientação registrada.</p>
              ) : (
                conducts.orientations.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{item.title}</p>
                        <p className="mt-2 text-sm text-[#52627A]">{item.text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeConduct("orientations", item.id)}
                        className="flex size-9 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] transition-colors hover:bg-[#FECACA]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </MedicalConductModal>
      ) : null}

      {activeAction === "certificate" ? (
        <MedicalConductModal
          title="Emitir Atestado"
          onClose={closeAction}
          footer={<Button onClick={addCertificate}>Salvar</Button>}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <ModalFieldLabel>Data de emissão</ModalFieldLabel>
              <Input
                type="date"
                value={certificateDraft.issueDate}
                onChange={(event) =>
                  setCertificateDraft((current) => ({
                    ...current,
                    issueDate: event.target.value,
                    text: attendance
                      ? buildCertificateText(attendance, event.target.value, current.startDate, Number(current.days) || 1)
                      : current.text,
                  }))
                }
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Data de início</ModalFieldLabel>
              <Input
                type="date"
                value={certificateDraft.startDate}
                onChange={(event) =>
                  setCertificateDraft((current) => ({
                    ...current,
                    startDate: event.target.value,
                    text: attendance
                      ? buildCertificateText(attendance, current.issueDate, event.target.value, Number(current.days) || 1)
                      : current.text,
                  }))
                }
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Quantidade de dias</ModalFieldLabel>
              <Input
                value={certificateDraft.days}
                inputMode="numeric"
                onChange={(event) =>
                  setCertificateDraft((current) => {
                    const days = sanitizeInteger(event.target.value, { maxDigits: 3 }) || "1";
                    return {
                      ...current,
                      days,
                      text: attendance ? buildCertificateText(attendance, current.issueDate, current.startDate, Number(days) || 1) : current.text,
                    };
                  })
                }
                className="h-10"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <ModalFieldLabel>Texto do atestado</ModalFieldLabel>
            <Textarea
              value={certificateDraft.text}
              onChange={(event) => setCertificateDraft((current) => ({ ...current, text: sanitizeText(event.target.value, 2000) }))}
              className="min-h-40"
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-[#52627A]">
              <input
                type="checkbox"
                checked={certificateDraft.includeCidCode}
                onChange={(event) => setCertificateDraft((current) => ({ ...current, includeCidCode: event.target.checked }))}
              />
              Informar e imprimir Código CID10 com autorização do paciente.
            </label>
            <label className="flex items-center gap-2 text-sm text-[#52627A]">
              <input
                type="checkbox"
                checked={certificateDraft.includeCidDescription}
                onChange={(event) =>
                  setCertificateDraft((current) => ({ ...current, includeCidDescription: event.target.checked }))
                }
              />
              Informar e imprimir Descrição CID10 com autorização do paciente.
            </label>
          </div>
          {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
        </MedicalConductModal>
      ) : null}

      {activeAction === "declaration" ? (
        <MedicalConductModal
          title="Emitir Declaração"
          onClose={closeAction}
          footer={<Button onClick={addDeclaration}>Salvar</Button>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <ModalFieldLabel>Data inicial</ModalFieldLabel>
              <Input
                type="datetime-local"
                value={declarationDraft.startDateTime}
                onChange={(event) =>
                  setDeclarationDraft((current) => ({
                    ...current,
                    startDateTime: event.target.value,
                    text: attendance ? buildDeclarationText(attendance, event.target.value, current.endDateTime) : current.text,
                  }))
                }
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <ModalFieldLabel>Data final</ModalFieldLabel>
              <Input
                type="datetime-local"
                value={declarationDraft.endDateTime}
                onChange={(event) =>
                  setDeclarationDraft((current) => ({
                    ...current,
                    endDateTime: event.target.value,
                    text: attendance ? buildDeclarationText(attendance, current.startDateTime, event.target.value) : current.text,
                  }))
                }
                className="h-10"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <ModalFieldLabel>Texto da declaração</ModalFieldLabel>
            <Textarea
              value={declarationDraft.text}
              onChange={(event) => setDeclarationDraft((current) => ({ ...current, text: sanitizeText(event.target.value, 2000) }))}
              className="min-h-40"
            />
          </div>
          {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
        </MedicalConductModal>
      ) : null}

      {activeAction === "recipe" ? (
        <MedicalConductModal
          title="Emitir Receita"
          onClose={closeAction}
          footer={<Button onClick={addRecipe}>Salvar Receita</Button>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <ModalFieldLabel>Forma de Preenchimento</ModalFieldLabel>
              <div className="flex gap-4 text-sm text-[#0F172A]">
                {[
                  { value: "PADRAO", label: "Padrão" },
                  { value: "LIVRE", label: "Livre" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recipeDraft.fillMode === item.value}
                      onChange={() => setRecipeDraft((current) => ({ ...current, fillMode: item.value as RecipeConduct["fillMode"] }))}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <ModalFieldLabel>Tipo de Receita</ModalFieldLabel>
              <div className="flex gap-4 text-sm text-[#0F172A]">
                {[
                  { value: "COMUM", label: "Comum" },
                  { value: "ESPECIAL", label: "Especial" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recipeDraft.recipeType === item.value}
                      onChange={() => setRecipeDraft((current) => ({ ...current, recipeType: item.value as RecipeConduct["recipeType"] }))}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <ModalFieldLabel>Minhas receitas favoritas</ModalFieldLabel>
            <Input
              value={recipeDraft.favoriteName}
              onChange={(event) => setRecipeDraft((current) => ({ ...current, favoriteName: sanitizeText(event.target.value, 120) }))}
              placeholder="Digite o nome da receita favorita, se houver"
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <ModalFieldLabel>Receita</ModalFieldLabel>
            <Textarea
              value={recipeDraft.text}
              onChange={(event) => setRecipeDraft((current) => ({ ...current, text: sanitizeText(event.target.value, 3000) }))}
              className="min-h-40"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#0F172A]">
            <input
              type="checkbox"
              checked={recipeDraft.saveAsFavorite}
              onChange={(event) => setRecipeDraft((current) => ({ ...current, saveAsFavorite: event.target.checked }))}
            />
            Salvar receita como favorita
          </label>
          {conductError ? <p className="text-sm font-semibold text-destructive">{conductError}</p> : null}
        </MedicalConductModal>
      ) : null}

      {toast ? <ToastCard toast={toast} /> : null}
    </AppShell>
  );
}
