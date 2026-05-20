"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LogOut, PackageSearch, PlusCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { User } from "@/lib/types";
import { canManageItems, canViewUsers, clearSession, getStoredUser } from "@/lib/storage";

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const showManagementLinks = canManageItems(user);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 text-slate-950 dark:text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white shadow-md ring-4 ring-blue-700/10 dark:bg-blue-500 dark:ring-blue-400/10">
            <PackageSearch size={22} />
          </span>
          <span>
            <span className="block text-lg font-black leading-tight">SIGAP</span>
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Achados e Perdidos</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/" className="sigap-secondary h-10 px-3" aria-label="Ir para Home">
            <Home size={17} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          {showManagementLinks ? (
            <Link href="/items/new" className="sigap-primary h-10 px-3" aria-label="Cadastrar item">
              <PlusCircle size={17} />
              <span className="hidden sm:inline">Cadastrar item</span>
            </Link>
          ) : null}
          {canViewUsers(user) ? (
            <Link href="/admin/users" className="sigap-secondary h-10 px-3" aria-label="Gerenciar usuarios">
              <Users size={17} />
              <span className="hidden sm:inline">Usuarios</span>
            </Link>
          ) : null}
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="sigap-secondary h-10 px-3" aria-label="Sair">
            <LogOut size={17} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
