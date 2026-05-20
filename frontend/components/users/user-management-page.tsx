"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Trash2, UserRoundCog, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { getApiErrorMessage, usuariosApi } from "@/lib/api";
import type { User } from "@/lib/types";
import { canDeleteUsers, canViewUsers, getStoredUser } from "@/lib/storage";

function roleLabel(role: User["role"]) {
  if (role === "super") {
    return "superusuario";
  }

  if (role === "admin") {
    return "administrador";
  }

  return "usuario comum";
}

export function UserManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = canDeleteUsers(currentUser);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await usuariosApi.list();
      setUsers(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel carregar usuarios."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    setCurrentUser(storedUser);

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    if (!canViewUsers(storedUser)) {
      router.replace("/");
      return;
    }

    void loadUsers();
  }, [loadUsers, router]);

  async function handleDelete(user: User) {
    if (!canDelete || isDeleting || user.role === "super" || user.id === currentUser?.id) {
      return;
    }

    if (confirmDeleteId !== user.id) {
      setConfirmDeleteId(user.id);
      return;
    }

    setIsDeleting(true);

    try {
      await usuariosApi.remove(user.id);
      setUsers((currentUsers) => currentUsers.filter((current) => current.id !== user.id));
      setConfirmDeleteId(null);
      toast.success("Usuario excluido com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel excluir usuario."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="sigap-section-band overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Administracao
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Usuarios do sistema</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Administradores podem consultar os usuarios. Apenas o superusuario pode excluir contas de administradores
                ou usuarios comuns.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Total de usuarios</span>
                <UsersRound size={22} />
              </div>
              <strong className="mt-2 block text-3xl font-black">{users.length}</strong>
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>

        <section className="mt-6 grid gap-3">
          {isLoading ? (
            <div className="sigap-surface rounded-lg p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Carregando usuarios...
            </div>
          ) : (
            users.map((user) => {
              const canRemoveThisUser = canDelete && user.role !== "super" && user.id !== currentUser?.id;

              return (
                <article key={user.id} className="sigap-surface rounded-lg p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-bold text-slate-950 dark:text-white">{user.nome}</h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {user.role === "super" ? <ShieldCheck size={14} /> : <UserRoundCog size={14} />}
                          {roleLabel(user.role)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        CPF: {user.cpf || "nao informado"} | Matricula: {user.matricula || "nao informada"}
                      </p>
                    </div>

                    {canRemoveThisUser ? (
                      <button
                        type="button"
                        className="sigap-danger min-w-40"
                        onClick={() => handleDelete(user)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={17} />
                        {isDeleting
                          ? "Excluindo..."
                          : confirmDeleteId === user.id
                            ? "Confirmar exclusao"
                            : "Excluir usuario"}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {user.role === "super" ? "Protegido" : "Sem permissao de exclusao"}
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
