"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActionListCard, PatientInfoStrip, RiskPill, StatusPill } from "@/components/medsync-primitives";
import { MaskedInput } from "@/components/form/masked-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapMedicalFormToPayload } from "@/lib/form-mappers";
import { formatCns, formatCpf, formatInteger, formatPhone } from "@/lib/input-masks";
import { sanitizeProcedureCode, sanitizeText } from "@/lib/input-sanitizers";
import { validateRequiredText } from "@/lib/input-validators";
import type {
  AmbulatoryAttendanceResponse,
  PatientAllergyResponse,
  PatientVaccineResponse,
} from "@/lib/types";
import { finishMedical, getAmbulatoryAttendance } from "@/services/ambulatory";
import { getClinicalSummary } from "@/services/medical-records";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";
import { riskClassificationToLabel, vaccineStatusApiToLabel } from "@/services/triage";

const medicalActions = [
  "Prescrever medicamento",
  "Prescrever procedimento",
  "Prescrever para observação",
  "Registrar internação",
  "Solicitar exame",
  "Arquivos do paciente",
  "Emitir orientação",
  "Emitir atestado",
  "Emitir declaração",
  "Emitir receita",
  "Imprimir ficha de referência",
];

type MedicalWorkspaceProps = {
  attendanceId: string;
};

type CidOption = {
  code: string;
  description: string;
};

const defaultCidSuggestions: CidOption[] = [
  { code: "J00", description: "Resfriado comum" },
  { code: "R50", description: "Febre" },
  { code: "I10", description: "Hipertensão essencial" },
  { code: "E11", description: "Diabetes mellitus tipo 2" },
];

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

export function MedicalWorkspace({ attendanceId }: MedicalWorkspaceProps) {
  const router = useRouter();
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [attendance, setAttendance] = useState<AmbulatoryAttendanceResponse | null>(null);
  const [patientAllergies, setPatientAllergies] = useState<PatientAllergyResponse[]>([]);
  const [patientVaccines, setPatientVaccines] = useState<PatientVaccineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    assessment: "",
    plan: "",
    procedureCode: "0301060096",
    selectedCids: [] as CidOption[],
    notifications: "Pesquisar...",
    accidentMoto: false,
    accidentCarro: false,
    accidentBicicleta: false,
    accidentPedestre: false,
    accidentOutros: false,
  });
  const [cidQuery, setCidQuery] = useState("");

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

        if (!mounted) return;

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
        setCidQuery("");
      } catch (rawError) {
        if (!mounted) return;
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

  const cidSuggestions = useMemo(() => {
    const normalized = cidQuery.trim().toLowerCase();
    if (!normalized) {
      return defaultCidSuggestions;
    }

    return defaultCidSuggestions.filter((cid) => {
      const searchable = `${cid.code} ${cid.description}`.toLowerCase();
      return searchable.includes(normalized);
    });
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
    ],
    [attendance]
  );

  function addCid(option: CidOption) {
    setForm((current) => {
      if (current.selectedCids.some((item) => item.code === option.code)) {
        return current;
      }

      return {
        ...current,
        selectedCids: [...current.selectedCids, option],
      };
    });
    setCidQuery("");
  }

  function removeCid(code: string) {
    setForm((current) => ({
      ...current,
      selectedCids: current.selectedCids.filter((item) => item.code !== code),
    }));
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

      await finishMedical(
        attendance.id,
        {
          ...payload,
          professionalName: "Equipe médica",
        },
        { demo: forceDemo }
      );

      router.push(`/patients/${attendance.patientId}/record`);
    } catch (rawError) {
      setError(getServiceErrorMessage(rawError, "Não foi possível finalizar o atendimento médico."));
    } finally {
      setSaving(false);
    }
  }

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

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">

                <div className="surface-card p-5">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="field-label">Avaliação (obrigatório)</label>
                      <Textarea
                        value={form.assessment}
                        onChange={(event) => {
                          setFieldErrors((current) => ({ ...current, assessment: "" }));
                          setForm({ ...form, assessment: sanitizeText(event.target.value, 2000) });
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
                          setForm({ ...form, plan: sanitizeText(event.target.value, 2000) });
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
                        onChange={(value) => setForm({ ...form, procedureCode: value })}
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
                      <Select value={form.notifications} onChange={(event) => setForm({ ...form, notifications: event.target.value })}>
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
                              checked={Boolean(form[key as keyof typeof form])}
                              onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ActionListCard actions={medicalActions} onActionClick={setSelectedAction} className="w-full xl:w-[320px]" />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push("/fila-atendimento")} disabled={saving}>
                Voltar
              </Button>
              <Button variant="outline" disabled={saving}>
                Salvar
              </Button>
              <Button variant="destructive" onClick={() => router.push("/fila-atendimento")} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={saving}>
                {saving ? "Finalizando..." : "Finalizar atendimento"}
              </Button>
            </div>

            {selectedAction ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/35 px-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                  <p className="text-[18px] font-semibold text-[#0F172A]">{selectedAction}</p>
                  <p className="mt-3 text-sm leading-6 text-[#52627A]">Funcionalidade preparada para integração.</p>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setSelectedAction(null)}>Fechar</Button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
