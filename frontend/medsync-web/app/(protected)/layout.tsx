"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { clearSession, getStoredUser, getToken, persistSession } from "../../lib/session";
import type { AuthUser } from "../../lib/types";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function validateSession() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const cachedUser = getStoredUser();
      if (active) {
        setIsChecking(false);
      }

      try {
        const me = await apiRequest<AuthUser>("/api/auth/me");
        if (!active) return;
        persistSession({ token, user: me });
      } catch (error) {
        if (!active) return;

        const status =
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof (error as { status?: unknown }).status === "number"
            ? (error as { status: number }).status
            : undefined;

        // Keep the cached user only for transient API failures. If the token
        // is invalid, force a clean login instead of leaving the UI in a
        // half-authenticated state with empty dashboards.
        if (cachedUser && status !== 401 && status !== 403) {
          return;
        }

        clearSession();
        router.replace("/login");
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <main className="min-h-screen grid place-items-center p-4">
        <section className="surface-card w-full max-w-md p-6">
          <h1 className="text-xl font-semibold text-foreground">Validando sessão...</h1>
          <p className="mt-2 text-sm text-muted-foreground">Aguarde um momento.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
