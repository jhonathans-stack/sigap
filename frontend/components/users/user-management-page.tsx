"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { IdCard, LockKeyhole, Mail, ShieldCheck, ShieldPlus, Trash2, User, UserRoundCog, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { getApiErrorMessage, usuariosApi } from "@/lib/api";
import type { User as SigapUser } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { canDeleteUsers, canViewUsers } from "@/lib/storage";
import { formatCpf, normalizeCpf } from "@/lib/utils";

const emptyAdminForm = {
  nome: "",
  email: "",
  senha: "",
  cpf: "",
  matricula: ""
};

function roleLabel(role: SigapUser["role"]) {
  if (role === "super") {
    return "superusuário";
  }

  if (role === "admin") {
    return "administrador";
  }

  return "usuário comum";
}

function AdminCreationPanel({ onCreated }: { onCreated: (user: SigapUser) => void }) {
  const [form, setForm] = useState(emptyAdminForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cpfDigits = normalizeCpf(form.cpf);

    if (form.nome.trim().length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (form.senha.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (cpfDigits.length < 11) {
      toast.error("Informe um CPF válido para o administrador.");
      return;
    }

    if (form.matricula.trim().length < 3) {
      toast.error("Informe a matrícula do administrador.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await usuariosApi.createAdmin({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        cpf: cpfDigits,
        matricula: form.matricula.trim()
      });

      toast.success("Administrador cadastrado com sucesso.");
      onCreated(response.usuario);
      setForm(emptyAdminForm);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível cadastrar o administrador."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sigap-surface mt-6 overflow-hidden rounded-lg">
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              Cadastro restrito
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Novo administrador</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Apenas o superusuário pode criar contas administrativas. Todos os campos principais são obrigatórios.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ShieldPlus size={26} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="sigap-label">Nome</span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="sigap-input pl-10"
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Nome completo"
                disabled={isSubmitting}
                required
              />
            </span>
          </label>

          <label className="space-y-2">
            <span className="sigap-label">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                className="sigap-input pl-10"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="admin@ifma.edu.br"
                disabled={isSubmitting}
                required
              />
            </span>
          </label>

          <label className="space-y-2">
            <span className="sigap-label">CPF</span>
            <span className="relative block">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="sigap-input pl-10"
                value={formatCpf(form.cpf)}
                onChange={(event) => setForm((current) => ({ ...current, cpf: normalizeCpf(event.target.value) }))}
                placeholder="000.000.000-00"
                disabled={isSubmitting}
                required
              />
            </span>
          </label>

          <label className="space-y-2">
            <span className="sigap-label">Matrícula</span>
            <span className="relative block">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="sigap-input pl-10"
                value={form.matricula}
                onChange={(event) => setForm((current) => ({ ...current, matricula: event.target.value }))}
                placeholder="Ex.: ADM-BIB-001"
                disabled={isSubmitting}
                required
              />
            </span>
          </label>

          <label className="space-y-2">
            <span className="sigap-label">Senha provisória</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                className="sigap-input pl-10"
                value={form.senha}
                onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
                placeholder="Mínimo de 6 caracteres"
                disabled={isSubmitting}
                required
              />
            </span>
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" className="sigap-primary min-w-56" disabled={isSubmitting}>
            <ShieldPlus size={18} />
            {isSubmitting ? "Cadastrando..." : "Cadastrar administrador"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SigapUser[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = canDeleteUsers(currentUser);

  const totals = useMemo(
    () => ({
      all: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      common: users.filter((user) => user.role === "user").length
    }),
    [users]
  );

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await usuariosApi.list();
      setUsers(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar usuários."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewUsers(currentUser)) {
      return;
    }

    void loadUsers();
  }, [currentUser, loadUsers]);

  function handleAdminCreated(user: SigapUser) {
    setUsers((currentUsers) => [user, ...currentUsers.filter((current) => current.id !== user.id)]);
  }

  async function handleDelete(user: SigapUser) {
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
      toast.success("Usuário excluído com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível excluir usuário."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="sigap-section-band overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Administração
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Usuários do sistema</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Administradores consultam usuários e o superusuário gerencia exclusões e novos administradores.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Total</span>
                  <UsersRound size={22} />
                </div>
                <strong className="mt-2 block text-3xl font-black">{totals.all}</strong>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Admins</span>
                  <ShieldCheck size={22} />
                </div>
                <strong className="mt-2 block text-3xl font-black">{totals.admins}</strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Comuns</span>
                  <UserRoundCog size={22} />
                </div>
                <strong className="mt-2 block text-3xl font-black">{totals.common}</strong>
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>

        {canDelete ? <AdminCreationPanel onCreated={handleAdminCreated} /> : null}

        <section className="mt-6 grid gap-3">
          {isLoading ? (
            <div className="sigap-surface rounded-lg p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Carregando usuários...
            </div>
          ) : (
            users.map((user) => {
              const canRemoveThisUser = canDelete && user.role !== "super" && user.id !== currentUser?.id;

              return (
                <article key={user.id} className="sigap-surface rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg">
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
                      <p className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                        <span>CPF: {user.cpf || "não informado"}</span>
                        <span>Matrícula: {user.matricula || "não informada"}</span>
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
                            ? "Confirmar exclusão"
                            : "Excluir usuário"}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {user.role === "super" ? "Protegido" : "Sem permissão de exclusão"}
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
