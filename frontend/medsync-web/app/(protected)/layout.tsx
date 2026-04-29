"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { roleLabel } from "../../lib/labels";
import { clearSession, getStoredUser, getToken, persistSession } from "../../lib/session";
import type { AuthUser } from "../../lib/types";

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const cachedUser = getStoredUser();
      if (cachedUser && active) {
        setUser(cachedUser);
      }

      try {
        const me = await apiRequest<AuthUser>("/api/auth/me");
        if (!active) return;
        setUser(me);
        persistSession({ token, user: me });
        setIsChecking(false);
      } catch {
        if (!active) return;
        clearSession();
        router.replace("/login");
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (isChecking) {
    return (
      <main className="min-h-screen grid place-items-center p-4">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h1 className="text-xl font-semibold">Validando sessão...</h1>
          <p className="mt-2 text-sm text-slate-600">Aguarde um momento.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 md:grid md:grid-cols-[250px_1fr]">
      <aside className="flex flex-col gap-4 border-b border-slate-700 bg-slate-900 p-5 text-slate-100 md:border-b-0 md:border-r md:border-r-slate-700">
        <h2 className="text-xl font-semibold text-white">MedSync</h2>
        <p className="text-sm text-slate-300">
          {user ? `${user.name} (${roleLabel(user.role)})` : "-"}
        </p>

        <nav className="grid gap-2">
          <Link
            href="/fila-espera"
            className={`rounded-md border px-3 py-2 text-sm transition ${
              pathname === "/fila-espera"
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-slate-600 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Fila de Espera
          </Link>
          <Link
            href="/usuarios"
            className={`rounded-md border px-3 py-2 text-sm transition ${
              pathname === "/usuarios"
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-slate-600 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Usuários do Sistema
          </Link>
          <Link
            href="/triagem"
            className={`rounded-md border px-3 py-2 text-sm transition ${
              pathname === "/triagem"
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-slate-600 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Triagem
          </Link>
          <Link
            href="/notificacoes"
            className={`rounded-md border px-3 py-2 text-sm transition ${
              pathname === "/notificacoes"
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-slate-600 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Notificações
          </Link>
        </nav>

        <button
          type="button"
          className="mt-auto rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
          onClick={logout}
        >
          Sair
        </button>
      </aside>

      <section className="p-5">{children}</section>
    </div>
  );
}
