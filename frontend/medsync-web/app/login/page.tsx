"use client";

import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { getToken, saveToken, USER_KEY } from "@/lib/auth";

type LoginResponse = {
  token: string;
  type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

const highlights = [
  {
    title: "Atendimento mais organizado",
    description: "Centralize o cadastro e a atualização dos pacientes em uma interface clara e objetiva.",
    icon: HeartPulse,
  },
  {
    title: "Segurança operacional",
    description: "Acesso controlado com foco em rastreabilidade e fluidez para a rotina assistencial.",
    icon: ShieldCheck,
  },
  {
    title: "Experiência com foco clínico",
    description: "Layout limpo, hierarquia visual precisa e leitura confortável em qualquer turno.",
    icon: Stethoscope,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@medsync.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/patients");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/api/auth/login", { email, password });
      saveToken(response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      router.push("/patients");
    } catch {
      setError("Falha no login. Verifique email e senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_26%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <div className="space-y-5">
              <Badge className="w-fit bg-primary/10 text-primary">Plataforma hospitalar inteligente</Badge>
              <div className="space-y-4">
                <h1 className="text-5xl font-semibold leading-tight tracking-tight text-foreground">
                  Um login com cara de sistema clínico moderno, limpo e confiável.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  O MedSync foi repensado para transmitir organização, serenidade visual e eficiência operacional em ambientes de saúde.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border-white/60 bg-white/70 shadow-soft dark:border-white/5 dark:bg-card/80">
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                        <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <Card className="overflow-hidden border-white/60 bg-card/90 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
            <CardContent className="space-y-8 p-7 sm:p-8">
              <div className="space-y-4">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-soft">
                  <HeartPulse className="size-7" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">Acessar o MedSync</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Entre na central de pacientes para acompanhar cadastros, editar registros e manter a operação organizada.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email corporativo</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seuemail@medsync.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar no sistema"}
                  {!loading ? <ArrowRight className="size-4" /> : null}
                </Button>
              </form>

              <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Acesso de demonstração</p>
                <p className="mt-2">Email: <span className="font-semibold text-foreground">admin@medsync.com</span></p>
                <p>Senha: <span className="font-semibold text-foreground">admin123</span></p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
