"use client";

import Link from "next/link";
import { CalendarDays, FilePenLine, MapPin, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MaskedInput } from "@/components/form/masked-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, parseApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { mapPatientFormToPayload } from "@/lib/form-mappers";
import { formatBirthDate, formatCns, formatCpf, formatPhone } from "@/lib/input-masks";
import { sanitizeAddress, sanitizeCns, sanitizeCpf, sanitizeName, sanitizePhone } from "@/lib/input-sanitizers";
import { formatIsoDateToBrazilian, validateBirthDate, validateCns, validateCpf, validatePhone, validateRequiredText } from "@/lib/input-validators";
import { formatPatientDocument, formatPatientPhone } from "@/lib/patient";

type Patient = {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  documentNumber: string;
  cns?: string | null;
  address: string;
};

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("MALE");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [cns, setCns] = useState("");
  const [address, setAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    async function loadPatient() {
      try {
        const patient = await apiRequest<Patient>(`/api/patients/${params.id}`);
        setFullName(patient.fullName);
        setBirthDate(formatIsoDateToBrazilian(patient.birthDate));
        setGender(patient.gender);
        setPhone(patient.phone);
        setDocumentNumber(patient.documentNumber);
        setCns(patient.cns || "");
        setAddress(patient.address);
      } catch (rawError) {
        const parsed = parseApiError(rawError);
        setError(parsed.message || "Não foi possível carregar os dados do paciente.");
      } finally {
        setLoadingPatient(false);
      }
    }

    void loadPatient();
  }, [params.id, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const nextErrors: Record<string, string> = {};
    const fullNameError = validateRequiredText(fullName, { message: "Informe o nome completo." });
    const birthDateError = validateBirthDate(birthDate);
    const phoneError = validatePhone(phone);
    const cpfError = validateCpf(documentNumber) || validateRequiredText(documentNumber, { message: "CPF deve conter 11 dígitos." });
    const cnsError = validateCns(cns, false);
    const addressError = validateRequiredText(address, { message: "Informe o endereço." });

    if (fullNameError) nextErrors.fullName = fullNameError;
    if (birthDateError) nextErrors.birthDate = birthDateError;
    if (phoneError) nextErrors.phone = phoneError;
    if (cpfError) nextErrors.documentNumber = cpfError;
    if (cnsError) nextErrors.cns = cnsError;
    if (addressError) nextErrors.address = addressError;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = mapPatientFormToPayload({
        fullName,
        birthDate,
        gender,
        phone,
        documentNumber,
        cns,
        address,
      });

      await apiRequest(`/api/patients/${params.id}`, {
        method: "PUT",
        body: payload
      });

      router.push(`/patients/${params.id}`);
    } catch (rawError) {
      const parsed = parseApiError(rawError);
      setError(parsed.message || "Não foi possível atualizar o paciente. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Editar paciente"
      description="Atualize dados cadastrais com uma interface mais clara, moderna e alinhada à estética de um sistema hospitalar premium."
      actions={
        <Button asChild variant="outline">
          <Link href={`/patients/${params.id}`}>Voltar para detalhes</Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Atualizar cadastro</CardTitle>
            <CardDescription>Revise as informações essenciais e mantenha o registro sempre consistente.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPatient ? (
              <div className="rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                Carregando dados do paciente...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => {
                        setFieldErrors((current) => ({ ...current, fullName: "" }));
                        setFullName(sanitizeName(event.target.value));
                      }}
                      maxLength={120}
                      required
                    />
                    {fieldErrors.fullName ? <p className="text-sm text-destructive">{fieldErrors.fullName}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de nascimento</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <MaskedInput
                        id="birthDate"
                        value={birthDate}
                        onChange={(value) => {
                          setFieldErrors((current) => ({ ...current, birthDate: "" }));
                          setBirthDate(value);
                        }}
                        sanitizer={(value) => value.replace(/\D/g, "").slice(0, 8)}
                        mask={formatBirthDate}
                        maxLength={10}
                        className="pl-11"
                        placeholder="DD/MM/AAAA"
                        inputMode="numeric"
                        required
                      />
                    </div>
                    {fieldErrors.birthDate ? <p className="text-sm text-destructive">{fieldErrors.birthDate}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select id="gender" value={gender} onChange={(event) => setGender(event.target.value)}>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Feminino</option>
                      <option value="OTHER">Outro</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <MaskedInput
                        id="phone"
                        value={phone}
                        onChange={(value) => {
                          setFieldErrors((current) => ({ ...current, phone: "" }));
                          setPhone(value);
                        }}
                        sanitizer={sanitizePhone}
                        mask={formatPhone}
                        maxLength={15}
                        className="pl-11"
                        inputMode="tel"
                        required
                      />
                    </div>
                    {fieldErrors.phone ? <p className="text-sm text-destructive">{fieldErrors.phone}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">CPF</Label>
                    <MaskedInput
                      id="documentNumber"
                      value={documentNumber}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, documentNumber: "" }));
                        setDocumentNumber(value);
                      }}
                      sanitizer={sanitizeCpf}
                      mask={formatCpf}
                      maxLength={14}
                      inputMode="numeric"
                      required
                    />
                    {fieldErrors.documentNumber ? <p className="text-sm text-destructive">{fieldErrors.documentNumber}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cns">CNS</Label>
                    <MaskedInput
                      id="cns"
                      value={cns}
                      onChange={(value) => {
                        setFieldErrors((current) => ({ ...current, cns: "" }));
                        setCns(value);
                      }}
                      sanitizer={sanitizeCns}
                      mask={formatCns}
                      maxLength={19}
                      inputMode="numeric"
                    />
                    {fieldErrors.cns ? <p className="text-sm text-destructive">{fieldErrors.cns}</p> : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={address}
                        onChange={(event) => {
                          setFieldErrors((current) => ({ ...current, address: "" }));
                          setAddress(sanitizeAddress(event.target.value));
                        }}
                        maxLength={255}
                        className="pl-11"
                        required
                      />
                    </div>
                    {fieldErrors.address ? <p className="text-sm text-destructive">{fieldErrors.address}</p> : null}
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={loading}>
                    <FilePenLine className="size-4" />
                    {loading ? "Salvando..." : "Salvar alterações"}
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link href={`/patients/${params.id}`}>Cancelar</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo atual</CardTitle>
              <CardDescription>Leitura rápida do cadastro antes da atualização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CPF atual</p>
                <p className="mt-2 font-medium text-foreground">{formatPatientDocument(documentNumber)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Telefone atual</p>
                <p className="mt-2 font-medium text-foreground">{formatPatientPhone(phone)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <RefreshCw className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Atualização controlada</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Revise os campos com atenção antes de salvar para manter consistência no prontuário administrativo.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Ambiente seguro</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  O novo layout reforça leitura, contraste e organização, facilitando o trabalho de equipes assistenciais.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
