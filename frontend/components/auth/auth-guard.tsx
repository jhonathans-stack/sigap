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

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && !getStoredToken()) {
        logout();
        router.replace("/login");
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [logout, router]);

  if (isLoading || isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-sm font-semibold shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-300" />
          Carregando...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
