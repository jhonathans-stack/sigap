"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { saveSession } from "@/lib/storage";

const rememberEmailKey = "sigap-remember-email";

type FieldErrors = {
  email?: string;
  senha?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [rememberAccess, setRememberAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(rememberEmailKey);

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberAccess(true);
    }
  }, []);

  function validateForm() {
    const nextErrors: FieldErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Informe seu email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Informe um email valido.";
    }

    if (!senha.trim()) {
      nextErrors.senha = "Informe sua senha.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      toast.error("Revise os campos destacados.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.login(email, senha);
      saveSession(response.token, response.usuario);

      if (rememberAccess) {
        window.localStorage.setItem(rememberEmailKey, email.trim());
      } else {
        window.localStorage.removeItem(rememberEmailKey);
      }

      toast.success("Login realizado com sucesso.");
      router.push("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel entrar."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="sigap-label">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="email"
              type="email"
              className="sigap-input border-slate-300 bg-slate-100 pl-10 placeholder:text-slate-500 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-[#020617] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              placeholder="seu.email@ifma.edu.br"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              required
            />
          </div>
          {errors.email ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="senha" className="sigap-label">
            Senha
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="senha"
              type={showPassword ? "text" : "password"}
              className="sigap-input border-slate-300 bg-slate-100 pl-10 pr-11 placeholder:text-slate-500 focus:border-blue-600 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-[#020617] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => {
                setSenha(event.target.value);
                setErrors((current) => ({ ...current, senha: undefined }));
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.senha)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.senha ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.senha}</p> : null}
        </div>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={rememberAccess}
              onChange={(event) => setRememberAccess(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-blue-600 dark:border-slate-700"
              disabled={isSubmitting}
            />
            Lembrar meu acesso
          </label>

          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-left font-semibold text-blue-700 hover:underline dark:text-blue-400 sm:text-right"
          >
            Esqueceu sua senha?
          </button>
        </div>

        <button type="submit" className="sigap-primary min-h-12 w-full text-base" disabled={isSubmitting}>
          <LogIn size={19} />
          {isSubmitting ? "Entrando..." : "Entrar no sistema"}
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
          ou
          <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Ainda nao tem uma conta?{" "}
          <Link href="/register" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Cadastre-se
          </Link>
        </p>
      </form>

      {isForgotModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            className="w-full max-w-md rounded-lg border border-slate-300 bg-slate-100 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-[#0b1220] dark:shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
                  Recuperacao
                </p>
                <h2 id="forgot-password-title" className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                  Esqueceu sua senha?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="sigap-secondary h-9 w-9 px-0"
                aria-label="Fechar modal"
              >
                <X size={17} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Para a demonstracao academica, solicite a redefinicao de senha ao administrador responsavel pelo SIGAP.
            </p>

            <button type="button" onClick={() => setIsForgotModalOpen(false)} className="sigap-primary mt-6 w-full">
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
