"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CreditCard, MapPin, PencilLine, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  formatPatientDate,
  formatPatientDocument,
  formatPatientGender,
  formatPatientPhone,
  getPatientInitials,
} from "@/lib/patient";

type Patient = {
  id: number;
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  documentNumber: string;
  address: string;
};

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    async function loadPatient() {
      try {
        const response = await api.get<Patient>(`/api/patients/${params.id}`);
        setPatient(response.data);
      } catch {
        setError("Paciente não encontrado ou acesso negado.");
      } finally {
        setLoading(false);
      }
    }

    void loadPatient();
  }, [params.id, router]);

  return (
    <AppShell
      title="Detalhes do paciente"
      description="Acompanhe as informações essenciais do cadastro em um resumo visual mais claro e profissional."
      actions={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/patients">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          {patient ? (
            <Button asChild>
              <Link href={`/patients/${patient.id}/edit`}>
                <PencilLine className="size-4" />
                Editar cadastro
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">Carregando dados do paciente...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      ) : patient ? (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-2xl font-semibold text-primary shadow-soft">
                  {getPatientInitials(patient.fullName)}
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge>Paciente ativo</Badge>
                    <Badge variant="secondary">Cadastro assistencial</Badge>
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">{patient.fullName}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Registro organizado para consulta rápida da equipe, com leitura mais confortável e foco nos dados principais.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">CPF</p>
                  <p className="mt-1 font-medium text-foreground">{formatPatientDocument(patient.documentNumber)}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Telefone</p>
                  <p className="mt-1 font-medium text-foreground">{formatPatientPhone(patient.phone)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações pessoais</CardTitle>
                  <CardDescription>Campos principais organizados com melhor hierarquia visual.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InfoBlock label="Nome completo" value={patient.fullName} />
                  <InfoBlock label="Gênero" value={formatPatientGender(patient.gender)} />
                  <InfoBlock label="Data de nascimento" value={formatPatientDate(patient.birthDate)} />
                  <InfoBlock label="Identificador" value={`Paciente #${patient.id}`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato e localização</CardTitle>
                  <CardDescription>Dados essenciais para comunicação e conferência cadastral.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InfoBlock label="CPF" value={formatPatientDocument(patient.documentNumber)} />
                  <InfoBlock label="Telefone" value={formatPatientPhone(patient.phone)} />
                  <div className="md:col-span-2">
                    <InfoBlock label="Endereço" value={patient.address || "Não informado"} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo operacional</CardTitle>
                  <CardDescription>Leitura rápida para suporte à rotina assistencial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <UserRound className="size-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Perfil</p>
                      <p className="text-sm font-medium text-foreground">Cadastro válido</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <CalendarDays className="size-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Nascimento</p>
                      <p className="text-sm font-medium text-foreground">{formatPatientDate(patient.birthDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <CreditCard className="size-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Documento</p>
                      <p className="text-sm font-medium text-foreground">{formatPatientDocument(patient.documentNumber)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <Phone className="size-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Contato</p>
                      <p className="text-sm font-medium text-foreground">{formatPatientPhone(patient.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                    <MapPin className="size-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Localização</p>
                      <p className="text-sm font-medium text-foreground">{patient.address || "Não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
