"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, parseApiError } from "../../lib/api";
import { getToken, persistSession } from "../../lib/session";
import type { AuthUser } from "../../lib/types";

interface LoginResponse {
  token: string;
  type: string;
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@medsync.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getToken()) {
      router.replace("/fila-espera");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: {
          email: email.trim(),
          password
        }
      });

      persistSession({
        token: response.token || "",
        user: response.user || null
      });

      router.replace("/fila-espera");
    } catch (rawError) {
      const parsed = parseApiError(rawError);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">MedSync</h1>
        <p className="mt-2 text-sm text-slate-600">
          Entre para acessar as telas protegidas do sistema.
        </p>

        <form className="mt-5 grid gap-2" onSubmit={handleSubmit}>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password" className="mt-1 text-sm font-medium text-slate-700">
            Senha
          </label>
          <input
            id="password"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-3 h-10 rounded-md bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
