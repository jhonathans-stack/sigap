"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpCircle,
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
import { FigmaCard } from "@/components/ui/figma-primitives";
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
type PendingUserAction = { type: "delete" | "promote"; user: SigapUser } | null;

function roleLabel(role: SigapUser["role"]) {
  if (role === "super") {
    return "superusuário";
  }

  if (role === "admin") {
    return "administrador";
  }

  return "usuário base";
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
    <form
      onSubmit={handleSubmit}
      className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      noValidate
    >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Novo administrador</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Apenas superusuarios podem criar contas administrativas. Todos os campos abaixo sao obrigatorios.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
          <button
            type="submit"
            className="inline-flex min-w-56 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
            disabled={isSubmitting}
          >
            <ShieldPlus size={18} />
            {isSubmitting ? "Cadastrando..." : "Cadastrar administrador"}
          </button>
        </div>
    </form>
  );
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SigapUser[]>([]);
  const [activeTab, setActiveTab] = useState<UserTab>("admins");
  const [pendingAction, setPendingAction] = useState<PendingUserAction>(null);
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

  function requestDelete(user: SigapUser) {
    if (!canDelete || busyUserId || user.role === "super" || user.id === currentUser?.id) {
      return;
    }

    setPendingAction({ type: "delete", user });
  }

  function requestPromote(user: SigapUser) {
    if (!canPromote || busyUserId || user.role !== "admin" || user.id === currentUser?.id) {
      return;
    }

    setPendingAction({ type: "promote", user });
  }

  async function confirmPendingAction() {
    if (!pendingAction || busyUserId) {
      return;
    }

    const { type, user } = pendingAction;
    setBusyUserId(user.id);

    try {
      if (type === "delete") {
        await usuariosApi.remove(user.id);
        setUsers((currentUsers) => currentUsers.filter((current) => current.id !== user.id));
        toast.success("Usuario excluido com sucesso.");
      } else {
        const response = await usuariosApi.promoteToSuper(user.id);
        setUsers((currentUsers) => currentUsers.map((current) => (current.id === user.id ? response.usuario : current)));
        toast.success("Administrador promovido para superusuario.");
      }

      setPendingAction(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          type === "delete" ? "Nao foi possivel excluir usuario." : "Nao foi possivel promover o administrador."
        )
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Usuários do sistema</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie permissões e controle de acesso
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Summary label="Total" value={totals.all} icon={UsersRound} />
          <Summary label="Super" value={totals.supers} icon={Crown} />
          <Summary label="Admins" value={totals.admins} icon={ShieldCheck} />
          <Summary label="Usuários base" value={totals.common} icon={UserRoundCog} />
        </div>

        {canDelete ? <AdminCreationPanel onCreated={handleAdminCreated} /> : null}

        <section className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
              <button
                type="button"
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "admins"
                    ? "border-b-2 border-blue-600 bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400"
                    : "bg-gray-50 text-gray-600 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("admins")}
              >
                Administradores e superusuários
              </button>
              <button
                type="button"
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "common"
                    ? "border-b-2 border-blue-600 bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400"
                    : "bg-gray-50 text-gray-600 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("common")}
              >
                Usuários base
              </button>
              </div>
            </div>

            <div className="grid gap-3 p-6">
            {isLoading ? (
              <div className="rounded-lg p-5 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Carregando usuários...
              </div>
            ) : visibleUsers.length ? (
              visibleUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  canDelete={canDelete}
                  canPromote={canPromote}
                  busyUserId={busyUserId}
                  onDelete={requestDelete}
                  onPromote={requestPromote}
                />
              ))
            ) : (
              <div className="rounded-lg p-8 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                Nenhum usuario encontrado nesta aba.
              </div>
            )}
            </div>
          </div>
        </section>
      </section>

      <ConfirmUserActionModal
        action={pendingAction}
        isBusy={Boolean(busyUserId)}
        onCancel={() => {
          if (!busyUserId) {
            setPendingAction(null);
          }
        }}
        onConfirm={confirmPendingAction}
      />
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
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type={type}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-10 text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
    <FigmaCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <Icon className="h-12 w-12 text-blue-500" />
      </div>
    </FigmaCard>
  );
}

function UserRow({
  user,
  currentUser,
  canDelete,
  canPromote,
  busyUserId,
  onDelete,
  onPromote
}: {
  user: SigapUser;
  currentUser: SigapUser | null;
  canDelete: boolean;
  canPromote: boolean;
  busyUserId: number | null;
  onDelete: (user: SigapUser) => void;
  onPromote: (user: SigapUser) => void;
}) {
  const canRemoveThisUser = canDelete && user.role !== "super" && user.id !== currentUser?.id;
  const canPromoteThisUser = canPromote && user.role === "admin" && user.id !== currentUser?.id;
  const isBusy = busyUserId === user.id;

  return (
    <article className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{user.nome}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {user.role === "super" ? <Crown size={14} /> : user.role === "admin" ? <ShieldCheck size={14} /> : <UserRoundCog size={14} />}
              {roleLabel(user.role)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{user.email}</p>
          <p className="mt-2 grid gap-1 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
            <span>CPF: {user.cpf ? formatCpf(user.cpf) : "Não informado"}</span>
            <span>Matrícula: {user.matricula || "Não informada"}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          {canPromoteThisUser ? (
            <button type="button" className="inline-flex min-w-48 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70" onClick={() => onPromote(user)} disabled={Boolean(busyUserId)}>
              <ArrowUpCircle size={17} />
              {isBusy ? "Promovendo..." : "Tornar superusuário"}
            </button>
          ) : null}

          {canRemoveThisUser ? (
            <button type="button" className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70" onClick={() => onDelete(user)} disabled={Boolean(busyUserId)}>
              <Trash2 size={17} />
              {isBusy ? "Excluindo..." : "Excluir usuário"}
            </button>
          ) : (
            <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {user.role === "super" ? "Protegido" : "Somente consulta"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ConfirmUserActionModal({
  action,
  isBusy,
  onCancel,
  onConfirm
}: {
  action: PendingUserAction;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) {
    return null;
  }

  const isDelete = action.type === "delete";
  const title = isDelete ? "Confirmar exclusao" : "Confirmar acesso super";
  const description = isDelete
    ? `Tem certeza que deseja excluir ${action.user.nome}? Essa acao remove o acesso do usuario ao SIGAP.`
    : `Tem certeza que deseja promover ${action.user.nome} para superusuario? Esse perfil tera acesso total ao sistema.`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                isDelete
                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
              }`}
            >
              {isDelete ? <AlertTriangle size={25} /> : <Crown size={25} />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{description}</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="font-bold text-gray-900 dark:text-white">{action.user.nome}</p>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{action.user.email}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              {roleLabel(action.user.role)}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              onClick={onCancel}
              disabled={isBusy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-70 ${
                isDelete ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={onConfirm}
              disabled={isBusy}
            >
              {isDelete ? <Trash2 size={17} /> : <Crown size={17} />}
              {isBusy ? (isDelete ? "Excluindo..." : "Promovendo...") : isDelete ? "Excluir" : "Promover"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
