"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, FileSearch, Home, PlusCircle, ShieldCheck, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageItems, canViewUsers } from "@/lib/storage";
import { getItemImageUrl } from "@/lib/utils";

function roleLabel(role?: string) {
  if (role === "super") {
    return "Superusuario";
  }

  if (role === "admin") {
    return "Administrador";
  }

  return "Usuario comum";
}

function maskCpf(cpf?: string | null) {
  const digits = String(cpf || "").replace(/\D/g, "");

  if (digits.length !== 11) {
    return "Nao informado";
  }

  return `${digits.slice(0, 2)}*.***.***-*${digits.slice(-1)}`;
}

export function Header() {
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const canManage = canManageItems(user);
  const photoUrl = getItemImageUrl(user?.foto_url);
  const initials = user?.nome
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SG";

  function handleLogout() {
    logout();
    window.location.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur dark:border-slate-800 dark:bg-slate-950/88">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="group text-slate-950 dark:text-white" title="Ir para a tela principal">
            <span className="block text-2xl font-black leading-tight tracking-normal group-hover:text-blue-700 dark:group-hover:text-blue-300">
              SIGAP
            </span>
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Achados e Perdidos</span>
          </Link>

          <button type="button" className="sigap-secondary h-10 px-3 lg:hidden" onClick={() => setIsMenuOpen((value) => !value)}>
            Menu
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            <Link href="/" className="sigap-secondary h-10 px-3">
              <Home size={17} />
              Home
            </Link>
            <Link href="/lost/new" className="sigap-secondary h-10 px-3">
              <FileSearch size={17} />
              Perdi um item
            </Link>
            <Link href="/requests" className="sigap-secondary h-10 px-3">
              <ClipboardList size={17} />
              Minhas solicitacoes
            </Link>
            {canManage ? (
              <Link href="/items/new" className="sigap-primary h-10 px-3">
                <PlusCircle size={17} />
                Cadastrar item
              </Link>
            ) : null}
            {canViewUsers(user) ? (
              <>
                <Link href="/admin/users" className="sigap-secondary h-10 px-3">
                  <Users size={17} />
                  Usuarios
                </Link>
                <Link href="/admin/audit" className="sigap-secondary h-10 px-3">
                  <ShieldCheck size={17} />
                  Auditoria
                </Link>
              </>
            ) : null}
          </nav>

          <div className="relative flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsProfileOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-px hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Abrir perfil"
            >
              {photoUrl ? <img src={photoUrl} alt="Foto do perfil" className="h-full w-full object-cover" /> : initials}
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-14 z-50 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Acessar perfil
                </button>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-700 text-sm font-black text-white">
                      {photoUrl ? <img src={photoUrl} alt="Foto do perfil" className="h-full w-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{user?.nome}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">CPF</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-100">{maskCpf(user?.cpf)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">Matricula</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-100">{user?.matricula || "Nao informada"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">Tipo de acesso</dt>
                      <dd className="font-semibold text-slate-800 dark:text-slate-100">{roleLabel(user?.role)}</dd>
                    </div>
                  </dl>
                </div>
                <button type="button" onClick={handleLogout} className="sigap-danger mt-4 w-full">
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {isMenuOpen ? (
          <nav className="grid gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800 lg:hidden">
            <Link href="/" className="sigap-secondary justify-start">
              <Home size={17} />
              Home
            </Link>
            <Link href="/lost/new" className="sigap-secondary justify-start">
              <FileSearch size={17} />
              Perdi um item
            </Link>
            <Link href="/requests" className="sigap-secondary justify-start">
              <ClipboardList size={17} />
              Minhas solicitacoes
            </Link>
            {canManage ? (
              <Link href="/items/new" className="sigap-primary justify-start">
                <PlusCircle size={17} />
                Cadastrar item
              </Link>
            ) : null}
            {canViewUsers(user) ? (
              <>
                <Link href="/admin/users" className="sigap-secondary justify-start">
                  <Users size={17} />
                  Usuarios
                </Link>
                <Link href="/admin/audit" className="sigap-secondary justify-start">
                  <ShieldCheck size={17} />
                  Auditoria
                </Link>
              </>
            ) : null}
          </nav>
        ) : null}
      </header>
    </>
  );
}
