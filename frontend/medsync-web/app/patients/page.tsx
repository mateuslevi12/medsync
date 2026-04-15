"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Activity, FileText, Search, ShieldCheck, Trash2, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatPatientDocument, formatPatientPhone } from "@/lib/patient";

type Patient = {
  id: number;
  fullName: string;
  documentNumber: string;
  phone: string;
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [cpfFilter, setCpfFilter] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    void loadPatients();
  }, [router]);

  async function loadPatients(name?: string, cpf?: string) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (name && name.trim()) {
        params.set("name", name.trim());
      }
      if (cpf && cpf.trim()) {
        params.set("cpf", cpf.trim());
      }

      const queryString = params.toString();
      const url = queryString ? `/api/patients?${queryString}` : "/api/patients";
      const response = await api.get<Patient[]>(url);
      setPatients(response.data);
    } catch {
      setError("Não foi possível carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadPatients(nameFilter, cpfFilter);
  }

  async function handleClearFilters() {
    setNameFilter("");
    setCpfFilter("");
    await loadPatients();
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Deseja realmente excluir este paciente?");
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/patients/${id}`);
      await loadPatients(nameFilter, cpfFilter);
    } catch {
      setError("Não foi possível excluir o paciente.");
    }
  }

  const hasFilters = Boolean(nameFilter.trim() || cpfFilter.trim());

  return (
    <AppShell
      title="Central de pacientes"
      description="Gerencie cadastros, acompanhe consultas operacionais e mantenha os dados assistenciais sempre organizados."
      actions={
        <Button asChild>
          <Link href="/patients/new">
            <UserRoundPlus className="size-4" />
            Novo paciente
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="metric-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pacientes exibidos</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "--" : patients.length}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Activity className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtro ativo</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{hasFilters ? "Sim" : "Não"}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Search className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prontidão operacional</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">24/7</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Módulo ativo</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">Cadastro</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Busca inteligente</CardTitle>
            <CardDescription>
              Encontre rapidamente pacientes por nome ou CPF em um fluxo pensado para a rotina hospitalar.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit bg-secondary/80">
            Consulta rápida
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="nameFilter">Nome do paciente</Label>
              <Input
                id="nameFilter"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="Ex.: Maria de Souza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpfFilter">CPF</Label>
              <Input
                id="cpfFilter"
                value={cpfFilter}
                onChange={(event) => setCpfFilter(event.target.value)}
                placeholder="Ex.: 11122233344"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                <Search className="size-4" />
                Buscar
              </Button>
              <Button type="button" variant="outline" onClick={handleClearFilters} disabled={loading}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Pacientes cadastrados</CardTitle>
            <CardDescription>
              Visualize, edite ou exclua registros com uma hierarquia visual mais limpa e profissional.
            </CardDescription>
          </div>
          <Badge variant="outline">{loading ? "Carregando" : `${patients.length} registro(s)`}</Badge>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/60">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-medium">Nome</th>
                    <th className="px-5 py-4 font-medium">CPF</th>
                    <th className="px-5 py-4 font-medium">Telefone</th>
                    <th className="px-5 py-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                        Carregando pacientes...
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                        Nenhum paciente encontrado para os filtros informados.
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="border-t border-border/70">
                        <td className="px-5 py-4 font-medium text-foreground">{patient.fullName}</td>
                        <td className="px-5 py-4 text-muted-foreground">{formatPatientDocument(patient.documentNumber)}</td>
                        <td className="px-5 py-4 text-muted-foreground">{formatPatientPhone(patient.phone)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/patients/${patient.id}`}>Ver</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/patients/${patient.id}/edit`}>Editar</Link>
                            </Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(patient.id)}>
                              <Trash2 className="size-4" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
