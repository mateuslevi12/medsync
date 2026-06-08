"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Shield,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { apiRequest, parseApiError } from "@/lib/api";
import { formatCpf } from "@/lib/input-masks";
import { normalizeCpf, sanitizeCpf } from "@/lib/input-sanitizers";
import { validateCpf, validateRequiredText } from "@/lib/input-validators";
import { getToken, persistSession } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

interface LoginResponse {
  token: string;
  type: string;
  user: AuthUser;
}

const DEMO_CPF = "00000000000";
const DEMO_EMAIL = "admin@medsync.com";
const DEMO_PASSWORD = "admin123";

const benefitCards = [
  { label: "Gestão Ambulatorial", icon: HeartPulse },
  { label: "Relatórios Avançados", icon: BarChart3 },
  { label: "Segurança Total", icon: Shield },
  { label: "Integração em Tempo Real", icon: Zap },
] as const;

const stats = [
  { value: "+200", label: "ESTABELECIMENTOS" },
  { value: "24/7", label: "SUPORTE" }
] as const;

function resolveLoginEmail(cpf: string) {
  const normalizedCpf = normalizeCpf(cpf);

  if (normalizedCpf === DEMO_CPF) {
    return DEMO_EMAIL;
  }

  return "";
}

function normalizeAuthError(rawError: unknown) {
  const parsed = parseApiError(rawError);

  if (parsed.status === 401 || parsed.status === 403) {
    return "CPF ou senha inválidos.";
  }

  if (!parsed.status || parsed.status >= 500) {
    return "Não foi possível acessar o sistema. Tente novamente.";
  }

  return "Não foi possível acessar o sistema. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState(formatCpf(DEMO_CPF));
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ cpf?: string; password?: string }>({});

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const formattedCpf = useMemo(() => formatCpf(cpf), [cpf]);

  function handleCpfChange(value: string) {
    setCpf(formatCpf(sanitizeCpf(value)));
    setError("");
    setFieldErrors((current) => ({ ...current, cpf: "" }));
  }

  async function authenticate(email: string, currentPassword: string) {
    const response = await apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: {
        email: email.trim().toLowerCase(),
        password: currentPassword,
      },
    });

    persistSession({
      token: response.token || "",
      user: response.user || null,
    });

    router.replace("/dashboard");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    const nextErrors = {
      cpf: validateCpf(cpf) || validateRequiredText(cpf, { message: "CPF deve conter 11 dígitos." }),
      password: validateRequiredText(password, { message: "Informe sua senha." }),
    };

    setFieldErrors(nextErrors);
    setError("");

    if (nextErrors.cpf || nextErrors.password) {
      return;
    }

    const loginEmail = resolveLoginEmail(cpf);

    if (!loginEmail) {
      setError("CPF ou senha inválidos.");
      return;
    }

    setLoading(true);

    try {
      await authenticate(loginEmail, password);
    } catch (rawError) {
      setError(normalizeAuthError(rawError));
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoAccess() {
    if (loading) {
      return;
    }

    setCpf(formatCpf(DEMO_CPF));
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      await authenticate(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (rawError) {
      setError(normalizeAuthError(rawError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#020617] text-white lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #020617 0%, #061B3A 38%, #0B102A 70%, #160B3D 100%), radial-gradient(circle at 25% 75%, rgba(14,165,233,0.28), transparent 38%), radial-gradient(circle at 85% 65%, rgba(99,102,241,0.22), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-65"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 min-h-screen px-6 py-8 md:px-10 md:py-10 lg:px-[60px] lg:py-12">
        <div className="grid min-h-[calc(100vh-64px)] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-16">
          <section className="flex flex-col justify-center">
            <div className="mb-10 flex items-center gap-3 lg:mb-14">
              <div className="flex size-12 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#2563EB_0%,#7C3AED_100%)] shadow-[0_18px_45px_rgba(37,99,235,0.35)]">
                <Activity className="size-6 text-white" />
              </div>
              <div>
                <p className="text-[20px] font-extrabold leading-6 text-white">MedSync</p>
                <p className="text-[14px] font-medium text-[#94A3B8]">HealthSys Distribuído</p>
              </div>
            </div>

            <div className="max-w-[620px]">
              <h1 className="text-[40px] font-black leading-[1] tracking-[-0.045em] sm:text-[52px] sm:leading-[56px] lg:text-[64px] lg:leading-[68px]">
                <span className="block text-white">MedSync</span>
                <span
                  className="block bg-[linear-gradient(90deg,#7DD3FC_0%,#22D3EE_45%,#A5B4FC_100%)] bg-clip-text text-transparent"
                >
                  Saúde Integrada
                </span>
              </h1>

              <p className="mt-6 max-w-[560px] text-[18px] font-medium leading-8 text-[#CBD5E1] lg:text-[20px]">
                Plataforma hospitalar completa para gestão ambulatorial, triagem, prontuário e atendimento médico em
                tempo real.
              </p>
            </div>

            <div className="mt-9 hidden max-w-[620px] grid-cols-1 gap-3 sm:grid sm:grid-cols-2 lg:mb-[72px]">
              {benefitCards.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex h-[58px] items-center gap-[14px] rounded-[14px] border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.58)] px-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[12px]"
                >
                  <div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(37,99,235,0.26)] text-[#93C5FD]">
                    <Icon className="size-[18px]" />
                  </div>
                  <p className="text-[14px] font-extrabold text-white">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 hidden items-center gap-12 lg:flex">
              {stats.map((item, index) => (
                <div key={item.label} className="flex items-center gap-12">
                  <div>
                    <p className="text-[30px] font-black leading-[34px] text-white">{item.value}</p>
                    <p className="mt-1 text-[12px] font-bold tracking-[0.04em] text-[#94A3B8]">{item.label}</p>
                  </div>
                  {index < stats.length - 1 ? <span className="h-8 w-px bg-[rgba(148,163,184,0.28)]" /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[420px]">
              <div className="flex min-h-[560px] w-full flex-col rounded-[22px] bg-white px-6 py-7 text-[#0F172A] shadow-[0_30px_80px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] sm:px-[42px] sm:py-[38px]">
                <div className="mb-[22px] flex size-14 items-center justify-center self-center rounded-2xl bg-[linear-gradient(135deg,#2563EB_0%,#7C3AED_100%)] text-white shadow-[0_16px_35px_rgba(79,70,229,0.32)]">
                  <Activity className="size-7" />
                </div>

                <h2 className="text-center text-[24px] font-black leading-[30px] text-[#0F172A]">Acesse sua conta</h2>
                <p className="mb-[34px] mt-2 text-center text-[14px] font-medium text-[#64748B]">
                  Entre com suas credenciais MedSync
                </p>

                <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 inline-flex items-center gap-2 text-[14px] font-bold text-[#334155]" htmlFor="cpf">
                        <UserRound className="size-4" />
                        CPF
                      </label>
                      <input
                        id="cpf"
                        type="text"
                        inputMode="numeric"
                        autoComplete="username"
                        maxLength={14}
                        value={formattedCpf}
                        onChange={(event) => handleCpfChange(event.target.value)}
                        placeholder="000.000.000-00"
                        className="h-[46px] w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-[16px] font-medium text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] placeholder:text-[#94A3B8]"
                      />
                      {fieldErrors.cpf ? (
                        <p className="mt-[10px] text-[13px] font-semibold text-[#DC2626]">{fieldErrors.cpf}</p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        className="mb-2 inline-flex items-center gap-2 text-[14px] font-bold text-[#334155]"
                        htmlFor="password"
                      >
                        <LockKeyhole className="size-4" />
                        Senha
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setError("");
                            setFieldErrors((current) => ({ ...current, password: "" }));
                          }}
                          placeholder="Digite sua senha"
                          className="h-[46px] w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 pr-12 text-[16px] font-medium text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)] placeholder:text-[#94A3B8]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-[#64748B] transition hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {fieldErrors.password ? (
                        <p className="mt-[10px] text-[13px] font-semibold text-[#DC2626]">{fieldErrors.password}</p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-[18px] h-12 w-full rounded-[10px] border-0 bg-[linear-gradient(90deg,#006EEB_0%,#5B2EFF_100%)] text-[16px] font-extrabold text-white shadow-[0_14px_26px_rgba(37,99,235,0.28)] transition hover:brightness-[1.03] hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>

                  {error ? <p className="mt-[10px] text-[13px] font-semibold text-[#DC2626]">{error}</p> : null}

                  <p className="mt-[18px] text-center text-[14px] text-[#64748B]">
                    Problemas para acessar?{" "}
                    <a href="mailto:suporte@medsync.com" className="font-extrabold text-[#006EEB]">
                      Entre em contato
                    </a>
                  </p>

                  <div className="mt-auto border-t border-[#E2E8F0] pt-[18px] text-center">
                    <p className="text-[12px] font-bold text-[#94A3B8]">&lt;/&gt; MedSync v1.0.0</p>
                    <p className="mt-1.5 inline-flex items-center justify-center gap-2 text-[12px] font-extrabold text-[#10B981]">
                      <ShieldCheck className="size-3.5" />
                      Conexão criptografada
                    </p>
                  </div>
                </form>
              </div>

              <div className="mt-[18px] text-center">
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  disabled={loading}
                  className="text-[14px] font-bold text-[#93C5FD] transition hover:text-white disabled:opacity-70"
                >
                  Entrar em modo demonstração →
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
