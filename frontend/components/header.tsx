"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { FigmaButton, FigmaModal } from "@/components/ui/figma-primitives";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
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

  return `${digits.substring(0, 2)}*.***.***-${digits.substring(digits.length - 2)}`;
}

function getInitials(name?: string | null) {
  return String(name || "Usuario")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function Header() {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const canManage = canManageItems(user);
  const photoUrl = getItemImageUrl(user?.foto_url);
  const initials = getInitials(user?.nome);

  const navLinks = [
    { href: "/", label: "Home", show: true },
    { href: "/lost/new", label: "Perdi um item", show: true },
    { href: "/requests", label: "Minhas solicitacoes", show: true },
    { href: "/items/new", label: "Cadastrar item", show: canManage },
    { href: "/admin/users", label: "Usuarios", show: canViewUsers(user) },
    { href: "/admin/audit", label: "Auditoria", show: canViewUsers(user) }
  ];

  function handleLogout() {
    logout();
    window.location.replace("/login");
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-blue-600 transition-opacity hover:opacity-80 dark:text-blue-400">
                SIGAP
              </Link>

              <div className="hidden items-center gap-6 md:flex">
                {navLinks.map((link) =>
                  link.show ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    >
                      {link.label}
                    </Link>
                  ) : null
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-green-500 font-semibold text-white transition-opacity hover:opacity-90"
                aria-label="Abrir perfil"
              >
                {photoUrl ? <img src={photoUrl} alt={user?.nome || "Perfil"} className="h-full w-full object-cover" /> : initials}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-gray-200 dark:border-gray-700 md:hidden">
            <div className="space-y-3 px-4 py-4">
              {navLinks.map((link) =>
                link.show ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {link.label}
                  </Link>
                ) : null
              )}
            </div>
          </div>
        ) : null}
      </nav>

      <FigmaModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Perfil do Usuario" size="sm">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-xl font-semibold text-white">
                {photoUrl ? <img src={photoUrl} alt={user.nome} className="h-full w-full object-cover" /> : initials}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.nome}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{roleLabel(user.role)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <ProfileLine label="Email" value={user.email} />
              <ProfileLine label="Matricula" value={user.matricula || "Nao informada"} />
              <ProfileLine label="CPF" value={maskCpf(user.cpf)} />
              <ProfileLine label="Tipo de acesso" value={roleLabel(user.role)} />
            </div>

            <FigmaButton type="button" variant="danger" onClick={handleLogout} className="mt-6 w-full">
              <LogOut className="h-4 w-4" />
              Sair
            </FigmaButton>
          </div>
        ) : null}
      </FigmaModal>
    </>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="break-words text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
