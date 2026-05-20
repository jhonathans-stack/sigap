"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Eye, EyeOff, IdCard, LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { LgpdModal } from "@/components/auth/lgpd-modal";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { formatCpf, normalizeCpf } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPhotoPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      event.target.value = "";
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cpfDigits = normalizeCpf(cpf);

    if (nome.trim().length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (senha.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (cpfDigits.length < 11) {
      toast.error("Informe um CPF válido.");
      return;
    }

    if (matricula.trim().length < 3) {
      toast.error("Informe sua matricula.");
      return;
    }

    if (!lgpdAccepted) {
      toast.error("Aceite o consentimento LGPD para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.register({
        nome,
        email,
        senha,
        cpf: cpfDigits,
        matricula: matricula.trim()
      });
      setSession(response.token, response.usuario);
      toast.success("Cadastro realizado com sucesso.");
      router.push("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível cadastrar."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome completo"
              disabled={isSubmitting}
              required
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
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@ifma.edu.br"
                disabled={isSubmitting}
                required
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
                onChange={(event) => setCpf(normalizeCpf(event.target.value))}
                placeholder="000.000.000-00"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
        </div>

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
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              disabled={isSubmitting}
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
              onChange={(event) => setMatricula(event.target.value)}
              placeholder="Ex.: 20252SI0016"
              disabled={isSubmitting}
              required
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
              onChange={(event) => setLgpdAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
              disabled={isSubmitting}
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
