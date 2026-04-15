"use client";

import Link from "next/link";
import { CalendarDays, FilePenLine, MapPin, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatPatientDocument, formatPatientPhone } from "@/lib/patient";

type Patient = {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  documentNumber: string;
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
  const [address, setAddress] = useState("");
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
        const response = await api.get<Patient>(`/api/patients/${params.id}`);
        const patient = response.data;
        setFullName(patient.fullName);
        setBirthDate(patient.birthDate);
        setGender(patient.gender);
        setPhone(patient.phone);
        setDocumentNumber(patient.documentNumber);
        setAddress(patient.address);
      } catch {
        setError("Não foi possível carregar os dados do paciente.");
      } finally {
        setLoadingPatient(false);
      }
    }

    void loadPatient();
  }, [params.id, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.put(`/api/patients/${params.id}`, {
        fullName,
        birthDate,
        gender,
        phone,
        documentNumber,
        address,
      });

      router.push(`/patients/${params.id}`);
    } catch {
      setError("Não foi possível atualizar o paciente. Verifique os dados.");
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
                    <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de nascimento</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="birthDate" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="pl-11" required />
                    </div>
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
                      <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="pl-11" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">CPF</Label>
                    <Input id="documentNumber" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} required />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                      <Textarea id="address" value={address} onChange={(event) => setAddress(event.target.value)} className="pl-11" required />
                    </div>
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
