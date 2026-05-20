"use client";

import Link from "next/link";
import { Home, LogOut, PackageSearch, PlusCircle, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageItems, canViewUsers } from "@/lib/storage";

export function Header() {
  const { logout, user } = useAuth();

  const showManagementLinks = canManageItems(user);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="group flex items-center gap-3 text-slate-950 dark:text-white"
          title="Ir para a tela principal"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white shadow-md ring-4 ring-blue-700/10 dark:bg-blue-500 dark:ring-blue-400/10">
            <PackageSearch size={22} />
          </span>
          <span>
            <span className="block text-lg font-black leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-300">
              SIGAP
            </span>
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Achados e Perdidos</span>
          </span>
        </Link>

        {user ? (
          <div className="hidden min-w-0 flex-1 justify-end lg:flex">
            <div className="max-w-sm rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.nome}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.role === "super" ? "Superusuário" : user.role === "admin" ? "Administrador" : "Usuário comum"}
              </p>
            </div>
          </div>
        ) : null}

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
            <Link href="/admin/users" className="sigap-secondary h-10 px-3" aria-label="Gerenciar usuários">
              <Users size={17} />
              <span className="hidden sm:inline">Usuários</span>
            </Link>
          ) : null}
          <ThemeToggle />
          <Link href="/login" onClick={logout} className="sigap-secondary h-10 px-3" aria-label="Sair">
            <LogOut size={17} />
            <span className="hidden sm:inline">Sair</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
