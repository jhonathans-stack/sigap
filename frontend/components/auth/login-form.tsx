"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { FigmaButton, FigmaInput, FigmaModal } from "@/components/ui/figma-primitives";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

const rememberEmailKey = "sigap-remember-email";

type FieldErrors = {
  email?: string;
  senha?: string;
};

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useAuth();
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
      setSession(response.token, response.usuario);

      if (rememberAccess) {
        window.localStorage.setItem(rememberEmailKey, email.trim());
      } else {
        window.localStorage.removeItem(rememberEmailKey);
      }

      toast.success("Login realizado com sucesso.");
      router.push("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao fazer login."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <FigmaInput
            type="email"
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            icon={Mail}
            disabled={isSubmitting}
            invalid={Boolean(errors.email)}
            required
          />
          {errors.email ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.email}</p> : null}
        </div>

        <div>
          <div className="relative">
            <FigmaInput
              type={showPassword ? "text" : "password"}
              label="Senha"
              placeholder="********"
              value={senha}
              onChange={(event) => {
                setSenha(event.target.value);
                setErrors((current) => ({ ...current, senha: undefined }));
              }}
              icon={Lock}
              disabled={isSubmitting}
              invalid={Boolean(errors.senha)}
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-[38px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.senha ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.senha}</p> : null}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberAccess}
              onChange={(event) => setRememberAccess(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Lembrar meu acesso</span>
          </label>

          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Esqueceu sua senha?
          </button>
        </div>

        <FigmaButton type="submit" className="w-full" loading={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar no sistema"}
        </FigmaButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ainda nao tem uma conta?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Cadastre-se
          </Link>
        </p>
      </div>

      <FigmaModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Recuperar Senha" size="sm">
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Entre em contato com o administrador do sistema para redefinir sua senha.
        </p>
        <FigmaButton type="button" onClick={() => setIsForgotModalOpen(false)} className="w-full">
          Entendi
        </FigmaButton>
      </FigmaModal>
    </>
  );
}
