"use client";

import Link from "next/link";
import { CalendarDays, FilePlus2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function NewPatientPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("MALE");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/api/patients", {
        fullName,
        birthDate,
        gender,
        phone,
        documentNumber,
        address,
      });

      router.push("/patients");
    } catch {
      setError("Não foi possível cadastrar o paciente. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Novo paciente"
      description="Cadastre rapidamente um novo paciente em uma interface mais limpa, organizada e preparada para a rotina clínica."
      actions={
        <Button asChild variant="outline">
          <Link href="/patients">Voltar para listagem</Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
            <CardDescription>
              Preencha as informações essenciais para admissão do paciente com clareza e padronização.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  <FilePlus2 className="size-4" />
                  {loading ? "Salvando..." : "Salvar paciente"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/patients">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orientações rápidas</CardTitle>
              <CardDescription>Boas práticas para manter consistência e qualidade no cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                Confira nome, CPF e telefone antes de concluir o cadastro para evitar duplicidades operacionais.
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                Use o endereço completo para facilitar contato, validação cadastral e continuidade assistencial.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Fluxo confiável</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  O formulário foi reorganizado para reduzir ruído visual e reforçar uma experiência com aparência profissional de sistema hospitalar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
