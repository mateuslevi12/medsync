"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MaskedInput } from "@/components/form/masked-input";
import { PatientInfoStrip } from "@/components/medsync-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapAllergyFormToPayload, mapTriageFormToPayload } from "@/lib/form-mappers";
import { formatBloodPressure, formatDecimal, formatInteger } from "@/lib/input-masks";
import { getCurrentUser, getPermissionMessage, hasPermission } from "@/lib/rbac";
import { sanitizeBloodPressure, sanitizeInteger, sanitizeText } from "@/lib/input-sanitizers";
import {
  validateBloodPressure,
  validateDecimalRange,
  validateIntegerRange,
  validateRequiredText,
} from "@/lib/input-validators";
import { cn } from "@/lib/utils";
import type { AmbulatoryAttendanceResponse } from "@/lib/types";
import { completeTriage, getAmbulatoryAttendance } from "@/services/ambulatory";
import { getPatientAllergies, getPatientVaccines } from "@/services/patients";
import { getServiceErrorMessage, isDemoModeEnabled } from "@/services/runtime";
import {
  riskClassificationToLabel,
  riskLabelToClassification,
  syncPatientClinicalInfo,
  vaccineStatusApiToLabel,
} from "@/services/triage";

const riskLevels = ["EMERGÊNCIA", "MUITO URGENTE", "URGENTE", "POUCO URGENTE", "NÃO URGENTE"] as const;
const riskOptions = [
  { label: "EMERGÊNCIA", className: "border-red-400 bg-red-50 text-red-700" },
  { label: "MUITO URGENTE", className: "border-orange-400 bg-orange-50 text-orange-700" },
  { label: "URGENTE", className: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { label: "POUCO URGENTE", className: "border-green-400 bg-green-50 text-green-700" },
  { label: "NÃO URGENTE", className: "border-blue-400 bg-blue-50 text-blue-700" },
] as const;
const vaccineStatuses = [
  { value: "Em dia", label: "Em dia" },
  { value: "Pendente", label: "Pendente" },
  { value: "Desconhecido", label: "Desconhecido" },
] as const;
const defaultVaccineStatus = vaccineStatuses[0].value;

type TriageWorkspaceProps = {
  attendanceId: string;
};

function normalizeVaccineStatus(status?: string | null): (typeof vaccineStatuses)[number]["value"] {
  if (status === "Em dia") return "Em dia";
  if (status === "Pendente") return "Pendente";
  return "Desconhecido";
}

export function TriageWorkspace({ attendanceId }: TriageWorkspaceProps) {
  const router = useRouter();
  const currentRole = getCurrentUser()?.role;
  const canEditTriage = hasPermission("triage.edit", currentRole);
  const [forceDemo, setForceDemo] = useState(isDemoModeEnabled());
  const [attendance, setAttendance] = useState<AmbulatoryAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newVaccineName, setNewVaccineName] = useState("");
  const [newVaccineStatus, setNewVaccineStatus] = useState<(typeof vaccineStatuses)[number]["value"]>(defaultVaccineStatus);
  const [vaccineError, setVaccineError] = useState<string | null>(null);
  const [form, setForm] = useState({
    observations: "",
    destination: "Atendimento Médico",
    risk: null as (typeof riskLevels)[number] | null,
    weightKg: "",
    heightCm: "",
    abdominalCircumference: "",
    bloodPressure: "",
    respiratoryRate: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
    glucose: "",
    painLevel: "",
    hasAllergy: false,
    allergyType: "Medicamento",
    allergyDescription: "",
    allergySeverity: "Moderada",
    vaccines: [] as Array<{ name: string; status: (typeof vaccineStatuses)[number]["value"] }>,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAmbulatoryAttendance(attendanceId, { demo: forceDemo });
        const [allergies, vaccines] = await Promise.all([
          getPatientAllergies(data.patientId, { demo: forceDemo }),
          getPatientVaccines(data.patientId, { demo: forceDemo }),
        ]);

        if (!mounted) return;

        setAttendance(data);
        const firstAllergy = allergies[0];
        setForm({
          observations: data.observations || "",
          destination: data.destination || "Atendimento Médico",
          risk: riskClassificationToLabel(data.riskClassification) || null,
          weightKg: data.weightKg || "",
          heightCm: data.heightCm || "",
          abdominalCircumference: data.abdominalCircumference || "",
          bloodPressure: data.bloodPressure || "",
          respiratoryRate: data.respiratoryRate || "",
          heartRate: data.heartRate || "",
          temperature: data.temperature || "",
          oxygenSaturation: data.oxygenSaturation || "",
          glucose: data.glucose || "",
          painLevel: data.painLevel ? String(data.painLevel) : "",
          hasAllergy: Boolean(data.hasAllergy ?? firstAllergy),
          allergyType:
            data.allergyType ||
            (firstAllergy?.type === "ALIMENTO"
              ? "Alimento"
              : firstAllergy?.type === "OUTRO"
                ? "Outro"
                : "Medicamento"),
          allergyDescription: data.allergyDescription || firstAllergy?.description || "",
          allergySeverity:
            data.allergySeverity ||
            (firstAllergy?.severity === "GRAVE"
              ? "Grave"
              : firstAllergy?.severity === "LEVE"
                ? "Leve"
                : "Moderada"),
          vaccines:
            data.vaccines.length > 0
              ? data.vaccines.map((vaccine) => ({
                  name: vaccine.name,
                  status: normalizeVaccineStatus(vaccine.status),
                }))
              : vaccines.length > 0
                ? vaccines.map((vaccine) => ({
                    name: vaccine.name,
                    status: normalizeVaccineStatus(vaccineStatusApiToLabel(vaccine.status)),
                  }))
                : [],
        });
      } catch (rawError) {
        if (!mounted) return;
        setError(getServiceErrorMessage(rawError, "Não foi possível carregar o acolhimento."));
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

  const bmi = useMemo(() => {
    const weight = Number(form.weightKg.replace(",", "."));
    const height = Number(form.heightCm.replace(",", "."));

    if (!weight || !height) {
      return attendance?.bmi || "0.00";
    }

    const value = weight / Math.pow(height / 100, 2);
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  }, [attendance?.bmi, form.heightCm, form.weightKg]);

  function handleAddVaccine() {
    const normalizedName = sanitizeText(newVaccineName, 80);

    if (!normalizedName) {
      setVaccineError("Informe o nome da vacina para adicionar.");
      return;
    }

    setVaccineError(null);
    setForm((current) => {
      const existingIndex = current.vaccines.findIndex(
        (vaccine) => vaccine.name.trim().toLowerCase() === normalizedName.toLowerCase()
      );

      if (existingIndex >= 0) {
        return {
          ...current,
          vaccines: current.vaccines.map((vaccine, index) =>
            index === existingIndex ? { ...vaccine, status: newVaccineStatus, name: normalizedName } : vaccine
          ),
        };
      }

      return {
        ...current,
        vaccines: [...current.vaccines, { name: normalizedName, status: newVaccineStatus }],
      };
    });
    setNewVaccineName("");
    setNewVaccineStatus(defaultVaccineStatus);
  }

  async function handleSubmit() {
    if (!canEditTriage) {
      setError(getPermissionMessage("triage.edit"));
      return;
    }

    if (!attendance || !form.risk) {
      setError("Selecione uma classificação de risco para concluir o acolhimento.");
      return;
    }

    const nextErrors: Record<string, string> = {};
    const weightError = validateDecimalRange(form.weightKg, {
      min: 0,
      max: 500,
      message: "Peso deve estar entre 0 e 500 kg.",
    });
    const heightError = validateIntegerRange(form.heightCm, {
      min: 30,
      max: 250,
      message: "Altura deve estar entre 30 e 250 cm.",
    });
    const abdomenError = validateDecimalRange(form.abdominalCircumference, {
      min: 0,
      max: 300,
      message: "Circunferência abdominal deve estar entre 0 e 300 cm.",
    });
    const pressureError = validateBloodPressure(form.bloodPressure);
    const respiratoryError = validateIntegerRange(form.respiratoryRate, {
      min: 0,
      max: 80,
      message: "Frequência respiratória deve estar entre 0 e 80.",
    });
    const heartError = validateIntegerRange(form.heartRate, {
      min: 0,
      max: 250,
      message: "Frequência cardíaca deve estar entre 0 e 250.",
    });
    const temperatureError = validateDecimalRange(form.temperature, {
      min: 25,
      max: 45,
      message: "Temperatura deve estar entre 25°C e 45°C.",
    });
    const oxygenError = validateIntegerRange(form.oxygenSaturation, {
      min: 0,
      max: 100,
      message: "Saturação deve estar entre 0% e 100%.",
    });
    const glucoseError = validateIntegerRange(form.glucose, {
      min: 0,
      max: 999,
      message: "Glicemia deve estar entre 0 e 999.",
    });
    const painError = validateIntegerRange(form.painLevel, {
      min: 0,
      max: 10,
      message: "Nível de dor deve estar entre 0 e 10.",
    });
    const allergyDescriptionError = form.hasAllergy
      ? validateRequiredText(form.allergyDescription, { message: "Informe a descrição da alergia." })
      : "";

    if (weightError) nextErrors.weightKg = weightError;
    if (heightError) nextErrors.heightCm = heightError;
    if (abdomenError) nextErrors.abdominalCircumference = abdomenError;
    if (pressureError) nextErrors.bloodPressure = pressureError;
    if (respiratoryError) nextErrors.respiratoryRate = respiratoryError;
    if (heartError) nextErrors.heartRate = heartError;
    if (temperatureError) nextErrors.temperature = temperatureError;
    if (oxygenError) nextErrors.oxygenSaturation = oxygenError;
    if (glucoseError) nextErrors.glucose = glucoseError;
    if (painError) nextErrors.painLevel = painError;
    if (allergyDescriptionError) nextErrors.allergyDescription = allergyDescriptionError;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Corrija os campos destacados antes de concluir o acolhimento.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const triagePayload = mapTriageFormToPayload({
        ...form,
        bmi,
      });
      const allergyPayload = mapAllergyFormToPayload(form);

      await syncPatientClinicalInfo(
        attendance.patientId,
        {
          ...allergyPayload,
          vaccines: triagePayload.vaccines,
        },
        { demo: forceDemo }
      );

      await completeTriage(
        attendance.id,
        {
          observations: triagePayload.observations,
          destination: form.destination,
          riskClassification: riskLabelToClassification(form.risk),
          weightKg: triagePayload.weightKg,
          heightCm: triagePayload.heightCm,
          bmi,
          abdominalCircumference: triagePayload.abdominalCircumference,
          bloodPressure: triagePayload.bloodPressure,
          respiratoryRate: triagePayload.respiratoryRate,
          heartRate: triagePayload.heartRate,
          temperature: triagePayload.temperature,
          oxygenSaturation: triagePayload.oxygenSaturation,
          glucose: triagePayload.glucose,
          painLevel: triagePayload.painLevel,
          ...allergyPayload,
          vaccines: triagePayload.vaccines,
        },
        { demo: forceDemo }
      );

      router.push("/fila-atendimento");
    } catch (rawError) {
      setError(getServiceErrorMessage(rawError, "Não foi possível concluir o acolhimento."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Acolhimento"
      breadcrumbs={[
        { label: "Hub", href: "/dashboard" },
        { label: "Ambulatorial", href: "/ambulatorial" },
        { label: "Fila de Atendimento", href: "/fila-atendimento" },
        { label: "Acolhimento" },
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

        {!loading && attendance && !canEditTriage ? (
          <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
            {getPermissionMessage("triage.edit")}
          </div>
        ) : null}

        {loading || !attendance ? (
          <div className="surface-card p-5 text-sm text-muted-foreground">Carregando dados do acolhimento...</div>
        ) : (
          <>
            <PatientInfoStrip
              items={[
                { label: "Nome do paciente", value: attendance.patientName },
                { label: "Idade", value: `${attendance.patientAge ?? "-"} anos` },
                { label: "CPF", value: attendance.patientCpf },
                { label: "CNS", value: attendance.patientCns || "-" },
                { label: "Telefone", value: attendance.patientPhone || "-" },
              ]}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px]">
              <fieldset disabled={!canEditTriage} className="contents">
              <div className="surface-card overflow-hidden">
                <div className="grid grid-cols-[1.1fr_minmax(0,1fr)] border-b border-border bg-[#F8FAFC] px-5 py-4">
                  <p className="text-[14px] font-semibold text-foreground">Itens</p>
                  <p className="text-[14px] font-semibold text-foreground">Medições</p>
                </div>

                <div className="grid grid-cols-[1.1fr_minmax(0,1fr)] gap-y-0 px-5">
                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Peso e Altura</div>
                  <div className="border-b border-border py-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_64px]">
                      <div className="space-y-1">
                        <MaskedInput
                          value={form.weightKg}
                          onChange={(value) => {
                            setFieldErrors((current) => ({ ...current, weightKg: "" }));
                            setForm({ ...form, weightKg: value });
                          }}
                          sanitizer={(value) => formatDecimal(value, { maxIntegerDigits: 3, maxDecimalDigits: 2 })}
                          mask={(value) => formatDecimal(value, { maxIntegerDigits: 3, maxDecimalDigits: 2 })}
                          placeholder="Peso (Kg)"
                          inputMode="decimal"
                        />
                        {fieldErrors.weightKg ? <p className="text-sm text-destructive">{fieldErrors.weightKg}</p> : null}
                      </div>
                      <div className="space-y-1">
                        <MaskedInput
                          value={form.heightCm}
                          onChange={(value) => {
                            setFieldErrors((current) => ({ ...current, heightCm: "" }));
                            setForm({ ...form, heightCm: value });
                          }}
                          sanitizer={(value) => sanitizeInteger(value, { maxDigits: 3 })}
                          mask={(value) => formatInteger(value, { maxDigits: 3 })}
                          placeholder="Altura (cm)"
                          inputMode="numeric"
                        />
                        {fieldErrors.heightCm ? <p className="text-sm text-destructive">{fieldErrors.heightCm}</p> : null}
                      </div>
                      <div className="flex flex-col justify-center rounded-lg border border-border bg-[#F8FAFC] px-3 text-sm font-semibold text-foreground">
                        IMC {bmi}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Circunferência Abdominal (cm)</div>
                  <div className="border-b border-border py-4">
                    <MaskedInput
                      value={form.abdominalCircumference}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, abdominalCircumference: "" }));
                        setForm({ ...form, abdominalCircumference: value });
                      }}
                      sanitizer={(value) => formatDecimal(value, { maxIntegerDigits: 3, maxDecimalDigits: 2 })}
                      mask={(value) => formatDecimal(value, { maxIntegerDigits: 3, maxDecimalDigits: 2 })}
                      placeholder="Circunferência (cm)"
                      inputMode="decimal"
                    />
                    {fieldErrors.abdominalCircumference ? <p className="mt-1 text-sm text-destructive">{fieldErrors.abdominalCircumference}</p> : null}
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Pressão Arterial (mmHg)</div>
                  <div className="border-b border-border py-4">
                    <MaskedInput
                      value={form.bloodPressure}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, bloodPressure: "" }));
                        setForm({ ...form, bloodPressure: value });
                      }}
                      sanitizer={sanitizeBloodPressure}
                      mask={formatBloodPressure}
                      placeholder="Pressão Arterial"
                      inputMode="numeric"
                    />
                    {fieldErrors.bloodPressure ? <p className="mt-1 text-sm text-destructive">{fieldErrors.bloodPressure}</p> : null}
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Frequência Respiratória e Cardíaca</div>
                  <div className="border-b border-border py-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <MaskedInput
                          value={form.respiratoryRate}
                          onChange={(value) => {
                            setFieldErrors((current) => ({ ...current, respiratoryRate: "" }));
                            setForm({ ...form, respiratoryRate: value });
                          }}
                          sanitizer={(value) => sanitizeInteger(value, { maxDigits: 2 })}
                          mask={(value) => formatInteger(value, { maxDigits: 2 })}
                          placeholder="FR (mpm)"
                          inputMode="numeric"
                        />
                        {fieldErrors.respiratoryRate ? <p className="text-sm text-destructive">{fieldErrors.respiratoryRate}</p> : null}
                      </div>
                      <div className="space-y-1">
                        <MaskedInput
                          value={form.heartRate}
                          onChange={(value) => {
                            setFieldErrors((current) => ({ ...current, heartRate: "" }));
                            setForm({ ...form, heartRate: value });
                          }}
                          sanitizer={(value) => sanitizeInteger(value, { maxDigits: 3 })}
                          mask={(value) => formatInteger(value, { maxDigits: 3 })}
                          placeholder="FC (bpm)"
                          inputMode="numeric"
                        />
                        {fieldErrors.heartRate ? <p className="text-sm text-destructive">{fieldErrors.heartRate}</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Temperatura (°C)</div>
                  <div className="border-b border-border py-4">
                    <MaskedInput
                      value={form.temperature}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, temperature: "" }));
                        setForm({ ...form, temperature: value });
                      }}
                      sanitizer={(value) => formatDecimal(value, { maxIntegerDigits: 2, maxDecimalDigits: 1 })}
                      mask={(value) => formatDecimal(value, { maxIntegerDigits: 2, maxDecimalDigits: 1 })}
                      placeholder="Temperatura"
                      inputMode="decimal"
                    />
                    {fieldErrors.temperature ? <p className="mt-1 text-sm text-destructive">{fieldErrors.temperature}</p> : null}
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Saturação de O2(%)</div>
                  <div className="border-b border-border py-4">
                    <MaskedInput
                      value={form.oxygenSaturation}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, oxygenSaturation: "" }));
                        setForm({ ...form, oxygenSaturation: value });
                      }}
                      sanitizer={(value) => sanitizeInteger(value, { maxDigits: 3 })}
                      mask={(value) => formatInteger(value, { maxDigits: 3 })}
                      inputMode="numeric"
                    />
                    {fieldErrors.oxygenSaturation ? <p className="mt-1 text-sm text-destructive">{fieldErrors.oxygenSaturation}</p> : null}
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Glicemia mg/dL</div>
                  <div className="border-b border-border py-4">
                    <MaskedInput
                      value={form.glucose}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, glucose: "" }));
                        setForm({ ...form, glucose: value });
                      }}
                      sanitizer={(value) => sanitizeInteger(value, { maxDigits: 3 })}
                      mask={(value) => formatInteger(value, { maxDigits: 3 })}
                      inputMode="numeric"
                    />
                    {fieldErrors.glucose ? <p className="mt-1 text-sm text-destructive">{fieldErrors.glucose}</p> : null}
                  </div>

                  <div className="border-b border-border py-6 text-[14px] font-medium text-foreground">Nível de dor (0-10)</div>
                  <div className="border-b border-border py-4">
                    <MaskedInput
                      value={form.painLevel}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, painLevel: "" }));
                        setForm({ ...form, painLevel: value });
                      }}
                      sanitizer={(value) => sanitizeInteger(value, { maxDigits: 2 })}
                      mask={(value) => formatInteger(value, { maxDigits: 2 })}
                      inputMode="numeric"
                    />
                    {fieldErrors.painLevel ? <p className="mt-1 text-sm text-destructive">{fieldErrors.painLevel}</p> : null}
                  </div>

                  <div className="py-6 text-[14px] font-medium text-foreground">Paciente tem alergia:</div>
                  <div className="py-4">
                    <div className="mb-3 flex items-center gap-5 text-sm text-foreground">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="allergy" checked={form.hasAllergy} onChange={() => setForm({ ...form, hasAllergy: true })} />
                        Sim
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="allergy"
                          checked={!form.hasAllergy}
                          onChange={() =>
                            setForm({
                              ...form,
                              hasAllergy: false,
                              allergyType: "Medicamento",
                              allergyDescription: "",
                              allergySeverity: "Moderada",
                            })
                          }
                        />
                        Não
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Select value={form.allergyType} onChange={(event) => setForm({ ...form, allergyType: event.target.value })}>
                        <option>Medicamento</option>
                        <option>Alimento</option>
                        <option>Outro</option>
                      </Select>
                      <Input
                        value={form.allergyDescription}
                        onChange={(event) => {
                          setFieldErrors((current) => ({ ...current, allergyDescription: "" }));
                          setForm({ ...form, allergyDescription: sanitizeText(event.target.value, 120) });
                        }}
                        maxLength={120}
                        placeholder="Descrição"
                      />
                      <Select value={form.allergySeverity} onChange={(event) => setForm({ ...form, allergySeverity: event.target.value })}>
                        <option>Leve</option>
                        <option>Moderada</option>
                        <option>Grave</option>
                      </Select>
                    </div>
                    {fieldErrors.allergyDescription ? <p className="mt-2 text-sm text-destructive">{fieldErrors.allergyDescription}</p> : null}
                  </div>

                  <div className="border-t border-border py-6 text-[14px] font-semibold text-foreground">Vacinas</div>
                  <div className="border-t border-border py-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Adicione vacinas vinculadas ao paciente durante o acolhimento.
                      </p>

                      <div className="space-y-3 rounded-xl border border-border bg-[#F8FAFC] p-4">
                        <Input
                          value={newVaccineName}
                          onChange={(event) => {
                            setNewVaccineName(sanitizeText(event.target.value, 80));
                            if (vaccineError) {
                              setVaccineError(null);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddVaccine();
                            }
                          }}
                          placeholder="Digite o nome da vacina"
                        />

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
                          <Select
                            value={newVaccineStatus}
                            onChange={(event) => setNewVaccineStatus(event.target.value as (typeof vaccineStatuses)[number]["value"])}
                          >
                            {vaccineStatuses.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </Select>
                          <Button type="button" variant="outline" className="h-9" onClick={handleAddVaccine}>
                            Adicionar
                          </Button>
                        </div>
                      </div>

                      {vaccineError ? <p className="text-sm text-destructive">{vaccineError}</p> : null}

                      {form.vaccines.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-[#F8FAFC] px-4 py-3 text-sm text-muted-foreground">
                          Nenhuma vacina adicionada para este paciente.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {form.vaccines.map((vaccine, index) => (
                            <div key={`${vaccine.name}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                              <p className="font-medium text-foreground">{vaccine.name}</p>
                              <div className="flex gap-2">
                                {vaccineStatuses.map((status) => (
                                  <button
                                    key={status.value}
                                    type="button"
                                    onClick={() =>
                                      setForm({
                                        ...form,
                                        vaccines: form.vaccines.map((current, vaccineIndex) =>
                                          vaccineIndex === index ? { ...current, status: status.value } : current
                                        ),
                                      })
                                    }
                                    className={`rounded-md border px-3 py-1 text-xs font-medium ${
                                      vaccine.status === status.value
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-white text-foreground"
                                    }`}
                                  >
                                    {status.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="surface-card p-5">
                <div className="space-y-5">
                  <div className="grid gap-2">
                    <label className="field-label">Observações</label>
                    <Textarea
                      value={form.observations}
                      onChange={(event) => setForm({ ...form, observations: sanitizeText(event.target.value, 1000) })}
                      maxLength={1000}
                      placeholder="Digite algo..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="field-label">Destino do paciente</label>
                    <Select value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })}>
                      <option>Atendimento Médico</option>
                      <option>Observação</option>
                      <option>Alta</option>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <label className="field-label">Classificação de risco</label>
                    <div className="space-y-2">
                      {riskOptions.map((riskOption) => (
                        <button
                          key={riskOption.label}
                          type="button"
                          onClick={() => setForm({ ...form, risk: riskOption.label })}
                          className={cn(
                            "block w-full rounded border p-3 text-left text-sm font-semibold",
                            riskOption.className,
                            form.risk === riskOption.label ? "ring-2 ring-primary ring-offset-1" : ""
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={form.risk === riskOption.label}
                            readOnly
                            className="mr-2 align-middle"
                          />
                          {riskOption.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-border pt-5">
                    <Button variant="outline" onClick={() => router.push("/fila-atendimento")} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button variant="outline" disabled={saving}>
                      Salvar
                    </Button>
                    <Button
                      onClick={() => void handleSubmit()}
                      disabled={saving || !canEditTriage}
                      title={!canEditTriage ? getPermissionMessage("triage.edit") : undefined}
                    >
                      {saving ? "Encaminhando..." : "Encaminhar para Atendimento Médico"}
                    </Button>
                  </div>
                </div>
              </div>
              </fieldset>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
