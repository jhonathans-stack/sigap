"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, getApiErrorMessage } from "@/lib/api";
import type { UserRole } from "@/lib/types";
import { getStoredToken } from "@/lib/storage";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthGuard({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const router = useRouter();
  const { isLoading, logout, setSession, token } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const allowedRolesKey = allowedRoles?.join("|") || "authenticated";

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let isActive = true;

    async function validateSession() {
      const activeToken = token || getStoredToken();

      if (!activeToken) {
        logout();
        router.replace("/login");
        return;
      }

      try {
        const response = await authApi.me();

        if (!isActive) {
          return;
        }

        const roles = allowedRolesKey === "authenticated" ? [] : (allowedRolesKey.split("|") as UserRole[]);

        if (roles.length && !roles.includes(response.usuario.role)) {
          router.replace("/");
          return;
        }

        setSession(activeToken, response.usuario);
        setIsChecking(false);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.warn(getApiErrorMessage(error, "Sessão inválida."));
        logout();
        router.replace("/login");
      }
    }

    void validateSession();

    return () => {
      isActive = false;
    };
  }, [allowedRolesKey, isLoading, logout, router, setSession, token]);

  if (isLoading || isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="sigap-surface rounded-lg p-6 text-sm font-semibold">Verificando sessão...</div>
      </main>
    );
  }

  return <>{children}</>;
}
