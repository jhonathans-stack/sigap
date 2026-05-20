"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Crown,
  IdCard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  User,
  UserRoundCog,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { useAuth } from "@/components/providers/auth-provider";
import { getApiErrorMessage, usuariosApi } from "@/lib/api";
import { canDeleteUsers, canViewUsers } from "@/lib/storage";
import type { User as SigapUser } from "@/lib/types";
import { formatCpf, normalizeCpf } from "@/lib/utils";

const emptyAdminForm = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  cpf: "",
  matricula: ""
};

type UserTab = "admins" | "common";

function roleLabel(role: SigapUser["role"]) {
  if (role === "super") {
    return "superusuario";
  }

  if (role === "admin") {
    return "administrador";
  }

  return "usuario comum";
}

function AdminCreationPanel({ onCreated }: { onCreated: (user: SigapUser) => void }) {
  const [form, setForm] = useState(emptyAdminForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function clearErrors() {
    if (errors.length) {
      setErrors([]);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cpfDigits = normalizeCpf(form.cpf);
    const nextErrors: string[] = [];

    if (form.nome.trim().length < 3) {
      nextErrors.push("Nome deve ter pelo menos 3 caracteres.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.push("Informe um email valido.");
    }

    if (form.senha.length < 6) {
      nextErrors.push("Senha deve ter pelo menos 6 caracteres.");
    }

    if (form.senha !== form.confirmarSenha) {
      nextErrors.push("As duas senhas devem ser iguais.");
    }

    if (cpfDigits.length !== 11) {
      nextErrors.push("Informe um CPF valido para o administrador.");
    }

    if (form.matricula.trim().length < 3) {
      nextErrors.push("Informe a matricula do administrador.");
    }

    if (nextErrors.length) {
      setErrors(nextErrors);
      toast.error("Revise os campos obrigatorios.");
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
      setErrors([]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel cadastrar o administrador."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sigap-surface mt-6 overflow-hidden rounded-lg" noValidate>
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              Cadastro restrito
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Novo administrador</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Apenas superusuarios podem criar contas administrativas. Todos os campos abaixo sao obrigatorios.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ShieldPlus size={26} />
          </div>
        </div>

        {errors.length ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <AdminInput
            label="Nome"
            icon={User}
            value={form.nome}
            onChange={(value) => {
              setForm((current) => ({ ...current, nome: value }));
              clearErrors();
            }}
            placeholder="Nome completo"
            disabled={isSubmitting}
            invalid={errors.some((error) => error.startsWith("Nome"))}
          />
          <AdminInput
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(value) => {
              setForm((current) => ({ ...current, email: value }));
              clearErrors();
            }}
            placeholder="admin@ifma.edu.br"
            disabled={isSubmitting}
            invalid={errors.some((error) => error.includes("email"))}
          />
          <AdminInput
            label="CPF"
            icon={IdCard}
            value={formatCpf(form.cpf)}
            onChange={(value) => {
              setForm((current) => ({ ...current, cpf: normalizeCpf(value) }));
              clearErrors();
            }}
            placeholder="000.000.000-00"
            disabled={isSubmitting}
            invalid={errors.some((error) => error.includes("CPF"))}
          />
          <AdminInput
            label="Matricula"
            icon={IdCard}
            value={form.matricula}
            onChange={(value) => {
              setForm((current) => ({ ...current, matricula: value }));
              clearErrors();
            }}
            placeholder="Ex.: ADM-BIB-001"
            disabled={isSubmitting}
            invalid={errors.some((error) => error.includes("matricula"))}
          />
          <AdminInput
            label="Senha provisoria"
            icon={LockKeyhole}
            type="password"
            value={form.senha}
            onChange={(value) => {
              setForm((current) => ({ ...current, senha: value }));
              clearErrors();
            }}
            placeholder="Minimo de 6 caracteres"
            disabled={isSubmitting}
            invalid={errors.some((error) => error.startsWith("Senha"))}
          />
          <AdminInput
            label="Confirmar senha"
            icon={LockKeyhole}
            type="password"
            value={form.confirmarSenha}
            onChange={(value) => {
              setForm((current) => ({ ...current, confirmarSenha: value }));
              clearErrors();
            }}
            placeholder="Digite a senha novamente"
            disabled={isSubmitting}
            invalid={errors.some((error) => error.includes("senhas"))}
          />
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
  const [activeTab, setActiveTab] = useState<UserTab>("admins");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmPromoteId, setConfirmPromoteId] = useState<number | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canDelete = canDeleteUsers(currentUser);
  const canPromote = currentUser?.role === "super";

  const adminUsers = useMemo(() => users.filter((user) => user.role === "admin" || user.role === "super"), [users]);
  const commonUsers = useMemo(() => users.filter((user) => user.role === "user"), [users]);
  const visibleUsers = activeTab === "admins" ? adminUsers : commonUsers;

  const totals = useMemo(
    () => ({
      all: users.length,
      admins: adminUsers.filter((user) => user.role === "admin").length,
      supers: adminUsers.filter((user) => user.role === "super").length,
      common: commonUsers.length
    }),
    [adminUsers, commonUsers, users.length]
  );

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
    if (!canViewUsers(currentUser)) {
      return;
    }

    void loadUsers();
  }, [currentUser, loadUsers]);

  function handleAdminCreated(user: SigapUser) {
    setUsers((currentUsers) => [user, ...currentUsers.filter((current) => current.id !== user.id)]);
    setActiveTab("admins");
  }

  async function handleDelete(user: SigapUser) {
    if (!canDelete || busyUserId || user.role === "super" || user.id === currentUser?.id) {
      return;
    }

    if (confirmDeleteId !== user.id) {
      setConfirmDeleteId(user.id);
      setConfirmPromoteId(null);
      return;
    }

    setBusyUserId(user.id);

    try {
      await usuariosApi.remove(user.id);
      setUsers((currentUsers) => currentUsers.filter((current) => current.id !== user.id));
      setConfirmDeleteId(null);
      toast.success("Usuario excluido com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel excluir usuario."));
    } finally {
      setBusyUserId(null);
    }
  }

  async function handlePromote(user: SigapUser) {
    if (!canPromote || busyUserId || user.role !== "admin" || user.id === currentUser?.id) {
      return;
    }

    if (confirmPromoteId !== user.id) {
      setConfirmPromoteId(user.id);
      setConfirmDeleteId(null);
      return;
    }

    setBusyUserId(user.id);

    try {
      const response = await usuariosApi.promoteToSuper(user.id);
      setUsers((currentUsers) => currentUsers.map((current) => (current.id === user.id ? response.usuario : current)));
      setConfirmPromoteId(null);
      toast.success("Administrador promovido para superusuario.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel promover o administrador."));
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="sigap-section-band overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Administracao
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Usuarios do sistema</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Consulte usuarios comuns, administre contas administrativas e conceda acesso super apenas quando necessario.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <Summary label="Total" value={totals.all} icon={UsersRound} />
              <Summary label="Super" value={totals.supers} icon={Crown} />
              <Summary label="Admins" value={totals.admins} icon={ShieldCheck} />
              <Summary label="Comuns" value={totals.common} icon={UserRoundCog} />
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>

        {canDelete ? <AdminCreationPanel onCreated={handleAdminCreated} /> : null}

        <section className="mt-6">
          <div className="sigap-surface rounded-lg p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={activeTab === "admins" ? "sigap-primary" : "sigap-secondary"}
                onClick={() => setActiveTab("admins")}
              >
                <ShieldCheck size={17} />
                Administradores e superusuarios
              </button>
              <button
                type="button"
                className={activeTab === "common" ? "sigap-primary" : "sigap-secondary"}
                onClick={() => setActiveTab("common")}
              >
                <UsersRound size={17} />
                Usuarios comuns
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {isLoading ? (
              <div className="sigap-surface rounded-lg p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Carregando usuarios...
              </div>
            ) : visibleUsers.length ? (
              visibleUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  canDelete={canDelete}
                  canPromote={canPromote}
                  confirmDeleteId={confirmDeleteId}
                  confirmPromoteId={confirmPromoteId}
                  busyUserId={busyUserId}
                  onDelete={handleDelete}
                  onPromote={handlePromote}
                />
              ))
            ) : (
              <div className="sigap-surface rounded-lg p-8 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                Nenhum usuario encontrado nesta aba.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function AdminInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  type = "text"
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="sigap-label">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type={type}
          className="sigap-input pl-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required
          aria-invalid={invalid}
        />
      </span>
    </label>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <Icon size={22} />
      </div>
      <strong className="mt-2 block text-3xl font-black">{value}</strong>
    </div>
  );
}

function UserRow({
  user,
  currentUser,
  canDelete,
  canPromote,
  confirmDeleteId,
  confirmPromoteId,
  busyUserId,
  onDelete,
  onPromote
}: {
  user: SigapUser;
  currentUser: SigapUser | null;
  canDelete: boolean;
  canPromote: boolean;
  confirmDeleteId: number | null;
  confirmPromoteId: number | null;
  busyUserId: number | null;
  onDelete: (user: SigapUser) => void;
  onPromote: (user: SigapUser) => void;
}) {
  const canRemoveThisUser = canDelete && user.role !== "super" && user.id !== currentUser?.id;
  const canPromoteThisUser = canPromote && user.role === "admin" && user.id !== currentUser?.id;
  const isBusy = busyUserId === user.id;

  return (
    <article className="sigap-surface rounded-lg p-4 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-950 dark:text-white">{user.nome}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {user.role === "super" ? <Crown size={14} /> : user.role === "admin" ? <ShieldCheck size={14} /> : <UserRoundCog size={14} />}
              {roleLabel(user.role)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
          <p className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
            <span>CPF: {user.cpf ? formatCpf(user.cpf) : "Nao informado"}</span>
            <span>Matricula: {user.matricula || "Nao informada"}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          {canPromoteThisUser ? (
            <button type="button" className="sigap-primary min-w-48" onClick={() => onPromote(user)} disabled={Boolean(busyUserId)}>
              <Crown size={17} />
              {isBusy ? "Promovendo..." : confirmPromoteId === user.id ? "Confirmar superusuario" : "Tornar superusuario"}
            </button>
          ) : null}

          {canRemoveThisUser ? (
            <button type="button" className="sigap-danger min-w-40" onClick={() => onDelete(user)} disabled={Boolean(busyUserId)}>
              <Trash2 size={17} />
              {isBusy ? "Excluindo..." : confirmDeleteId === user.id ? "Confirmar exclusao" : "Excluir usuario"}
            </button>
          ) : (
            <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {user.role === "super" ? "Protegido" : "Somente consulta"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
