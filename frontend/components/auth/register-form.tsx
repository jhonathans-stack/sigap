"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Eye, EyeOff, IdCard, LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { LgpdModal } from "@/components/auth/lgpd-modal";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { formatCpf, normalizeCpf } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const maxPhotoSize = 5 * 1024 * 1024;
const allowedPhotoTypes = ["image/jpeg", "image/png"];

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function clearErrors() {
    if (errors.length) {
      setErrors([]);
    }
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (!allowedPhotoTypes.includes(file.type)) {
      toast.error("A foto deve ser JPG ou PNG.");
      event.target.value = "";
      return;
    }

    if (file.size > maxPhotoSize) {
      toast.error("A foto deve ter no maximo 5MB.");
      event.target.value = "";
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cpfDigits = normalizeCpf(cpf);
    const nextErrors: string[] = [];

    if (nome.trim().length < 3) {
      nextErrors.push("Nome deve ter pelo menos 3 caracteres.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.push("Informe um email valido.");
    }

    if (senha.length < 6) {
      nextErrors.push("Senha deve ter pelo menos 6 caracteres.");
    }

    if (senha !== confirmarSenha) {
      nextErrors.push("As duas senhas devem ser iguais.");
    }

    if (cpfDigits.length !== 11) {
      nextErrors.push("Informe um CPF valido.");
    }

    if (matricula.trim().length < 3) {
      nextErrors.push("Informe sua matricula.");
    }

    if (!lgpdAccepted) {
      nextErrors.push("Aceite o consentimento LGPD para continuar.");
    }

    if (nextErrors.length) {
      setErrors(nextErrors);
      toast.error("Revise os campos obrigatorios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("nome", nome.trim());
      formData.append("email", email.trim());
      formData.append("senha", senha);
      formData.append("cpf", cpfDigits);
      formData.append("matricula", matricula.trim());

      if (photoFile) {
        formData.append("foto", photoFile);
      }

      const response = await authApi.register(formData);
      setSession(response.token, response.usuario);
      toast.success("Cadastro realizado com sucesso.");
      router.replace("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel cadastrar."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.length ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="nome" className="sigap-label">
            Nome
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="nome"
              className="sigap-input border-slate-300 bg-slate-100 pl-10 dark:border-slate-800 dark:bg-[#020617]"
              value={nome}
              onChange={(event) => {
                setNome(event.target.value);
                clearErrors();
              }}
              placeholder="Seu nome completo"
              disabled={isSubmitting}
              required
              aria-invalid={errors.some((error) => error.startsWith("Nome"))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="email" className="sigap-label">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="email"
                type="email"
                className="sigap-input border-slate-300 bg-slate-100 pl-10 dark:border-slate-800 dark:bg-[#020617]"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearErrors();
                }}
                placeholder="email@ifma.edu.br"
                disabled={isSubmitting}
                required
                aria-invalid={errors.some((error) => error.includes("email"))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="cpf" className="sigap-label">
              CPF
            </label>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="cpf"
                className="sigap-input border-slate-300 bg-slate-100 pl-10 dark:border-slate-800 dark:bg-[#020617]"
                value={formatCpf(cpf)}
                onChange={(event) => {
                  setCpf(normalizeCpf(event.target.value));
                  clearErrors();
                }}
                placeholder="000.000.000-00"
                disabled={isSubmitting}
                required
                aria-invalid={errors.some((error) => error.includes("CPF"))}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="register-password" className="sigap-label">
              Senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className="sigap-input border-slate-300 bg-slate-100 pl-10 pr-11 dark:border-slate-800 dark:bg-[#020617]"
                value={senha}
                onChange={(event) => {
                  setSenha(event.target.value);
                  clearErrors();
                }}
                placeholder="Minimo de 6 caracteres"
                disabled={isSubmitting}
                required
                aria-invalid={errors.some((error) => error.includes("Senha"))}
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
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-register-password" className="sigap-label">
              Confirmar senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="confirm-register-password"
                type={showPassword ? "text" : "password"}
                className="sigap-input border-slate-300 bg-slate-100 pl-10 dark:border-slate-800 dark:bg-[#020617]"
                value={confirmarSenha}
                onChange={(event) => {
                  setConfirmarSenha(event.target.value);
                  clearErrors();
                }}
                placeholder="Digite a senha novamente"
                disabled={isSubmitting}
                required
                aria-invalid={errors.some((error) => error.includes("senhas"))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="matricula" className="sigap-label">
            Matricula
          </label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="matricula"
              className="sigap-input border-slate-300 bg-slate-100 pl-10 dark:border-slate-800 dark:bg-[#020617]"
              value={matricula}
              onChange={(event) => {
                setMatricula(event.target.value);
                clearErrors();
              }}
              placeholder="Ex.: 20252SI0016"
              disabled={isSubmitting}
              required
              aria-invalid={errors.some((error) => error.includes("matricula"))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="foto" className="sigap-label">
            Foto
          </label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            className="sigap-input border-slate-300 bg-slate-100 dark:border-slate-800 dark:bg-[#020617]"
            onChange={handlePhotoChange}
          />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview da foto" className="h-28 w-28 rounded-lg object-cover shadow-sm" />
          ) : (
            <div className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-100 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-[#020617] dark:text-slate-400">
              <Camera size={22} />
              Preview
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-300 bg-slate-100 p-3 dark:border-slate-800 dark:bg-[#020617]">
          <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={lgpdAccepted}
              onChange={(event) => {
                setLgpdAccepted(event.target.checked);
                clearErrors();
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300"
              disabled={isSubmitting}
              required
            />
            <span>Li e concordo com o tratamento dos meus dados conforme a LGPD</span>
          </label>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
          >
            Ver detalhes do consentimento
          </button>
        </div>

        <button type="submit" className="sigap-primary w-full" disabled={isSubmitting}>
          <UserPlus size={18} />
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <LgpdModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
