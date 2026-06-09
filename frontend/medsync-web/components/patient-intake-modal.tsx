"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { MaskedInput } from "@/components/form/masked-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mapQueueSearchQuery } from "@/lib/form-mappers";
import { formatCns, formatCpf, formatPhone, formatInteger } from "@/lib/input-masks";
import { sanitizeCns, sanitizeCpf, sanitizeName, sanitizePhone, sanitizeSearchText, sanitizeText, sanitizeInteger } from "@/lib/input-sanitizers";
import { validateCns, validateCpf, validateIntegerRange, validatePhone, validateRequiredText } from "@/lib/input-validators";
import { searchPatients } from "@/services/patients";
import { cn } from "@/lib/utils";

const steps = ["Tipo de entrada", "Dados do paciente", "Encaminhamento"];
const MIN_SEARCH_LENGTH = 2;
const MAX_VISIBLE_RESULTS = 8;

export type IntakePatientOption = {
  id: number;
  fullName: string;
  documentNumber: string;
  cns?: string | null;
  phone?: string | null;
  age?: number | null;
  birthDate?: string | null;
};

export type PatientIntakeSubmission = {
  entryType: "existing" | "new";
  selectedPatientId?: number;
  selectedPatient?: IntakePatientOption | null;
  destination: string;
  priority: string;
  notes: string;
  form: {
    fullName: string;
    cpf: string;
    cns: string;
    age: string;
    phone: string;
  };
};

type PatientIntakeModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PatientIntakeSubmission) => void;
  demo?: boolean;
  submitting?: boolean;
  error?: string | null;
};

export function PatientIntakeModal({
  open,
  onClose,
  onSubmit,
  demo = false,
  submitting = false,
  error = null,
}: PatientIntakeModalProps) {
  const [step, setStep] = useState(0);
  const [entryType, setEntryType] = useState<"existing" | "new">("existing");
  const [selectedPatient, setSelectedPatient] = useState<IntakePatientOption | null>(null);
  const [destination, setDestination] = useState("Acolhimento");
  const [priority, setPriority] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IntakePatientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    cpf: "",
    cns: "",
    age: "",
    phone: "",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setStep(0);
    setEntryType("existing");
    setSelectedPatient(null);
    setDestination("Acolhimento");
    setPriority("Normal");
    setNotes("");
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
    setSuggestionsOpen(false);
    setFieldErrors({});
    setForm({
      fullName: "",
      cpf: "",
      cns: "",
      age: "",
      phone: "",
    });
  }, [open]);

  useEffect(() => {
    if (!open || entryType !== "existing") {
      setSearching(false);
      setSuggestionsOpen(false);
      setSearchResults([]);
      return;
    }

    const normalizedQuery = mapQueueSearchQuery(searchQuery);

    if (selectedPatient) {
      setSearching(false);
      setSuggestionsOpen(false);
      return;
    }

    if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
      setSearching(false);
      setSuggestionsOpen(false);
      setSearchResults([]);
      return;
    }

    let active = true;

    setSearching(true);

    void searchPatients(normalizedQuery, { demo })
      .then((results) => {
        if (!active) {
          return;
        }

        setSearchResults(results.slice(0, MAX_VISIBLE_RESULTS));
        setSuggestionsOpen(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSearchResults([]);
        setSuggestionsOpen(true);
      })
      .finally(() => {
        if (active) {
          setSearching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [demo, entryType, open, searchQuery, selectedPatient]);

  if (!open) return null;

  function handleSelectPatient(patient: IntakePatientOption) {
    setSelectedPatient(patient);
    setSearchQuery(`${patient.fullName}`);
    setSearchResults([]);
    setSuggestionsOpen(false);
  }

  function handleClearSearch() {
    setSelectedPatient(null);
    setSearchQuery("");
    setSearchResults([]);
    setSuggestionsOpen(false);
    searchInputRef.current?.focus();
  }

  function validateNewPatientForm() {
    const nextErrors: Record<string, string> = {};
    const fullNameError = validateRequiredText(form.fullName, { message: "Informe o nome completo." });
    const cpfError = validateCpf(form.cpf) || validateRequiredText(form.cpf, { message: "CPF deve conter 11 dígitos." });
    const cnsError = validateCns(form.cns, false);
    const phoneError = validatePhone(form.phone);
    const ageError = validateIntegerRange(form.age, {
      min: 0,
      max: 130,
      message: "Idade deve estar entre 0 e 130 anos.",
    });

    if (fullNameError) nextErrors.fullName = fullNameError;
    if (cpfError) nextErrors.cpf = cpfError;
    if (cnsError) nextErrors.cns = cnsError;
    if (phoneError) nextErrors.phone = phoneError;
    if (ageError) nextErrors.age = ageError;

    return nextErrors;
  }

  function nextStep() {
    if (step === 0) {
      if (entryType === "existing") {
        if (!selectedPatient) {
          return;
        }

        setStep(2);
        return;
      }

      setStep(1);
      return;
    }

    if (step === 1) {
      const nextErrors = validateNewPatientForm();
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        return;
      }

      setStep(2);
    }
  }

  function previousStep() {
    if (step === 2 && entryType === "existing") {
      setStep(0);
      return;
    }

    setStep((current) => Math.max(current - 1, 0));
  }

  function handleConfirm() {
    if (entryType === "new") {
      const nextErrors = validateNewPatientForm();
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        if (step !== 1) {
          setStep(1);
        }
        return;
      }
    }

    onSubmit({
      entryType,
      selectedPatientId: selectedPatient?.id,
      selectedPatient,
      destination,
      priority,
      notes,
      form: {
        ...form,
        fullName: sanitizeName(form.fullName),
        cpf: form.cpf,
        cns: form.cns,
        age: sanitizeInteger(form.age, { maxDigits: 3 }),
        phone: form.phone,
      },
    });
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      return;
    }

    if (event.key === "Enter" && searchResults.length > 0 && !selectedPatient) {
      event.preventDefault();
      handleSelectPatient(searchResults[0]);
    }
  }

  const canAdvance =
    step === 0
      ? entryType === "existing"
        ? Boolean(selectedPatient)
        : true
      : step === 1
        ? Boolean(form.fullName.trim() && form.cpf.trim() && form.phone.trim())
        : false;

  const canConfirm =
    entryType === "existing"
      ? Boolean(selectedPatient?.id)
      : Boolean(form.fullName.trim() && form.cpf.trim() && form.phone.trim());

  const normalizedSearchQuery = mapQueueSearchQuery(searchQuery);
  const showInitialSearchMessage = entryType === "existing" && !selectedPatient && normalizedSearchQuery.length === 0;
  const showMinCharsMessage =
    entryType === "existing" &&
    !selectedPatient &&
    normalizedSearchQuery.length > 0 &&
    normalizedSearchQuery.length < MIN_SEARCH_LENGTH;
  const showEmptySearchMessage =
    entryType === "existing" &&
    !selectedPatient &&
    !searching &&
    normalizedSearchQuery.length >= MIN_SEARCH_LENGTH &&
    searchResults.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="surface-card w-full max-w-[1040px] rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-[20px] font-bold text-foreground">Incluir paciente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Incluir paciente na fila de atendimento</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-wrap gap-3">
            {steps.map((stepLabel, index) => (
              <div key={stepLabel} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                    index <= step ? "bg-primary text-white" : "bg-[#E2E8F0] text-[#64748B]"
                  )}
                >
                  {index + 1}
                </div>
                <span className={cn("text-sm font-medium", index <= step ? "text-foreground" : "text-muted-foreground")}>
                  {stepLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">
          {step === 0 ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEntryType("existing")}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-colors",
                    entryType === "existing" ? "border-primary bg-[#EEF4FF]" : "border-border bg-white"
                  )}
                >
                  <p className="text-[16px] font-semibold text-foreground">Paciente existente</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Localize um paciente já cadastrado e direcione-o para a fila sem repetir o cadastro.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType("new")}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-colors",
                    entryType === "new" ? "border-primary bg-[#EEF4FF]" : "border-border bg-white"
                  )}
                >
                  <p className="text-[16px] font-semibold text-foreground">Novo cadastro</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Registrar dados básicos do paciente e seguir com o atendimento.
                  </p>
                </button>
              </div>

              {entryType === "existing" ? (
                <div className="rounded-xl border border-border bg-[#F8FAFC] p-5">
                  <label className="field-label">Pesquisar paciente</label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(event) => {
                        setSelectedPatient(null);
                        const rawValue = event.target.value;
                        const digits = rawValue.replace(/\D/g, "");
                        const nextValue =
                          digits.length > 0 && digits.length === rawValue.trim().length
                            ? digits.length <= 11
                              ? formatCpf(digits)
                              : formatCns(digits)
                            : sanitizeSearchText(rawValue, 80, { trim: false });
                        setSearchQuery(nextValue);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Digite nome, CPF ou CNS para pesquisar..."
                      className="pl-10 pr-10"
                      autoComplete="off"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-[#E2E8F0] hover:text-foreground"
                        aria-label="Limpar pesquisa"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  {showInitialSearchMessage ? (
                    <p className="mt-3 text-sm text-[#52627A]">
                      Pesquise por nome, CPF ou CNS para localizar um paciente já cadastrado.
                    </p>
                  ) : null}

                  {showMinCharsMessage ? (
                    <p className="mt-3 text-sm text-[#52627A]">Digite pelo menos 2 caracteres para pesquisar.</p>
                  ) : null}

                  {searching ? <p className="mt-3 text-sm text-[#52627A]">Pesquisando pacientes...</p> : null}

                  {showEmptySearchMessage ? (
                    <p className="mt-3 text-sm text-[#52627A]">
                      Nenhum paciente encontrado. Você pode seguir com novo cadastro.
                    </p>
                  ) : null}

                  {suggestionsOpen && searchResults.length > 0 && !selectedPatient ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-white">
                      <ul role="listbox">
                        {searchResults.map((patient) => (
                          <li key={patient.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectPatient(patient)}
                              className="w-full border-b border-[#E2E8F0] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#EFF6FF]"
                            >
                              <p className="text-sm font-semibold text-foreground">{patient.fullName}</p>
                              <p className="mt-1 text-sm text-[#52627A]">
                                CPF {formatCpf(patient.documentNumber)} • CNS {patient.cns ? formatCns(patient.cns) : "-"} • {patient.age ?? "?"} anos
                              </p>
                              {patient.phone ? <p className="mt-1 text-sm text-[#52627A]">{formatPhone(patient.phone)}</p> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedPatient ? (
                    <div className="mt-4 rounded-xl border border-primary bg-[#EFF6FF] p-4">
                      <p className="text-sm font-medium text-primary">Paciente selecionado para inclusão na fila.</p>
                      <p className="mt-3 text-[16px] font-semibold text-foreground">{selectedPatient.fullName}</p>
                      <p className="mt-1 text-sm text-[#52627A]">
                        CPF {formatCpf(selectedPatient.documentNumber)} • CNS {selectedPatient.cns ? formatCns(selectedPatient.cns) : "-"} • {selectedPatient.age ?? "?"} anos
                      </p>
                      {selectedPatient.phone ? <p className="mt-1 text-sm text-[#52627A]">{formatPhone(selectedPatient.phone)}</p> : null}
                      <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={handleClearSearch} disabled={submitting}>
                          Trocar paciente
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 1 && entryType === "new" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <label className="field-label">Nome completo</label>
                <Input
                  value={form.fullName}
                  onChange={(event) => {
                    setFieldErrors((current) => ({ ...current, fullName: "" }));
                    setForm({ ...form, fullName: sanitizeName(event.target.value, { trim: false }) });
                  }}
                  maxLength={120}
                />
                {fieldErrors.fullName ? <p className="text-sm text-destructive">{fieldErrors.fullName}</p> : null}
              </div>
              <div className="grid gap-2">
                <label className="field-label">CPF</label>
                <MaskedInput
                  value={form.cpf}
                  onChange={(value) => {
                    setFieldErrors((current) => ({ ...current, cpf: "" }));
                    setForm({ ...form, cpf: value });
                  }}
                  sanitizer={sanitizeCpf}
                  mask={formatCpf}
                  maxLength={14}
                  inputMode="numeric"
                />
                {fieldErrors.cpf ? <p className="text-sm text-destructive">{fieldErrors.cpf}</p> : null}
              </div>
              <div className="grid gap-2">
                <label className="field-label">CNS</label>
                <MaskedInput
                  value={form.cns}
                  onChange={(value) => {
                    setFieldErrors((current) => ({ ...current, cns: "" }));
                    setForm({ ...form, cns: value });
                  }}
                  sanitizer={sanitizeCns}
                  mask={formatCns}
                  maxLength={19}
                  inputMode="numeric"
                />
                {fieldErrors.cns ? <p className="text-sm text-destructive">{fieldErrors.cns}</p> : null}
              </div>
              <div className="grid gap-2">
                <label className="field-label">Idade</label>
                <MaskedInput
                  value={form.age}
                  onChange={(value) => {
                    setFieldErrors((current) => ({ ...current, age: "" }));
                    setForm({ ...form, age: value });
                  }}
                  sanitizer={(value) => sanitizeInteger(value, { maxDigits: 3 })}
                  mask={(value) => formatInteger(value, { maxDigits: 3 })}
                  maxLength={3}
                  inputMode="numeric"
                />
                {fieldErrors.age ? <p className="text-sm text-destructive">{fieldErrors.age}</p> : null}
              </div>
              <div className="grid gap-2">
                <label className="field-label">Telefone</label>
                <MaskedInput
                  value={form.phone}
                  onChange={(value) => {
                    setFieldErrors((current) => ({ ...current, phone: "" }));
                    setForm({ ...form, phone: value });
                  }}
                  sanitizer={sanitizePhone}
                  mask={formatPhone}
                  maxLength={15}
                  inputMode="tel"
                />
                {fieldErrors.phone ? <p className="text-sm text-destructive">{fieldErrors.phone}</p> : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="field-label">Destino inicial</label>
                  <Select value={destination} onChange={(event) => setDestination(event.target.value)}>
                    <option>Acolhimento</option>
                    <option>Atendimento Médico</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="field-label">Prioridade operacional</label>
                  <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                    <option>Normal</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="field-label">Observações</label>
                  <Textarea value={notes} onChange={(event) => setNotes(sanitizeText(event.target.value, 500))} placeholder="Digite algo..." />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-[#F8FAFC] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">Resumo</p>
                <p className="mt-4 text-sm text-muted-foreground">Paciente</p>
                <p className="text-[16px] font-semibold text-foreground">
                  {entryType === "existing" ? selectedPatient?.fullName : form.fullName || "Novo cadastro"}
                </p>
                <p className="mt-1 text-sm text-[#52627A]">
                  {entryType === "existing"
                    ? `CPF ${selectedPatient?.documentNumber ? formatCpf(selectedPatient.documentNumber) : "-"} • CNS ${selectedPatient?.cns ? formatCns(selectedPatient.cns) : "-"} • ${selectedPatient?.age ?? "?"} anos`
                    : `CPF ${form.cpf || "-"} • CNS ${form.cns || "-"} • ${form.age || "?"} anos`}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">Encaminhamento</p>
                <p className="text-[16px] font-semibold text-foreground">{destination}</p>
                <p className="mt-4 text-sm text-muted-foreground">Prioridade</p>
                <p className="text-[16px] font-semibold text-foreground">{priority}</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <div className="flex gap-3">
            {step > 0 ? (
              <Button variant="outline" onClick={previousStep} disabled={submitting}>
                Voltar
              </Button>
            ) : null}
            {step < steps.length - 1 ? (
              <Button onClick={nextStep} disabled={!canAdvance || submitting}>
                Continuar
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={!canConfirm || submitting}>
                {submitting ? "Incluindo..." : "Incluir paciente"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
