"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FileText, Info, Lock, Mail, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { FigmaButton, FigmaInput, FigmaModal } from "@/components/ui/figma-primitives";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { formatCpf, normalizeCpf } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

const maxPhotoSize = 5 * 1024 * 1024;
const allowedPhotoTypes = ["image/jpeg", "image/png"];

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    matricula: "",
    senha: "",
    confirmarSenha: ""
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lgpdModalOpen, setLgpdModalOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  function clearErrors() {
    if (errors.length) {
      setErrors([]);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: name === "cpf" ? normalizeCpf(value) : value
    }));
    clearErrors();
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setFoto(null);
      setFotoPreview("");
      return;
    }

    if (!allowedPhotoTypes.includes(file.type)) {
      toast.error("Por favor, selecione uma imagem valida.");
      event.target.value = "";
      return;
    }

    if (file.size > maxPhotoSize) {
      toast.error("A foto deve ter no maximo 5MB.");
      event.target.value = "";
      return;
    }

    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }

    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function validate() {
    const cpfDigits = normalizeCpf(formData.cpf);
    const nextErrors: string[] = [];

    if (formData.nome.trim().length < 3) {
      nextErrors.push("Nome completo e obrigatorio.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.push("Email valido e obrigatorio.");
    }

    if (cpfDigits.length !== 11) {
      nextErrors.push("CPF valido e obrigatorio.");
    }

    if (formData.matricula.trim().length < 3) {
      nextErrors.push("Matricula e obrigatoria.");
    }

    if (formData.senha.length < 6) {
      nextErrors.push("Senha deve ter pelo menos 6 caracteres.");
    }

    if (formData.senha !== formData.confirmarSenha) {
      nextErrors.push("As senhas nao coincidem.");
    }

    if (!lgpdConsent) {
      nextErrors.push("Voce precisa aceitar os termos de uso.");
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const nextErrors = validate();

    if (nextErrors.length) {
      setErrors(nextErrors);
      toast.error("Revise os campos obrigatorios.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("nome", formData.nome.trim());
      data.append("email", formData.email.trim());
      data.append("cpf", normalizeCpf(formData.cpf));
      data.append("matricula", formData.matricula.trim());
      data.append("senha", formData.senha);

      if (foto) {
        data.append("foto", foto);
      }

      const response = await authApi.register(data);
      setSession(response.token, response.usuario);
      toast.success("Cadastro realizado com sucesso.");
      router.replace("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao cadastrar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {errors.length ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <FigmaInput
              type="text"
              name="nome"
              label="Nome completo *"
              placeholder="Joao da Silva"
              value={formData.nome}
              onChange={handleChange}
              icon={User}
              disabled={loading}
              invalid={errors.some((error) => error.includes("Nome"))}
              required
            />
          </div>

          <FigmaInput
            type="email"
            name="email"
            label="Email *"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            disabled={loading}
            invalid={errors.some((error) => error.includes("Email"))}
            required
          />

          <FigmaInput
            type="text"
            name="cpf"
            label="CPF *"
            placeholder="000.000.000-00"
            value={formatCpf(formData.cpf)}
            onChange={handleChange}
            icon={CreditCard}
            maxLength={14}
            disabled={loading}
            invalid={errors.some((error) => error.includes("CPF"))}
            required
          />

          <FigmaInput
            type="text"
            name="matricula"
            label="Matricula *"
            placeholder="202400001"
            value={formData.matricula}
            onChange={handleChange}
            icon={FileText}
            disabled={loading}
            invalid={errors.some((error) => error.includes("Matricula"))}
            required
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Foto (opcional)</label>
            <div className="flex items-center gap-4">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-full border-2 border-gray-300 object-cover dark:border-gray-600"
                />
              ) : null}
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 transition-colors hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{foto ? foto.name : "Selecionar foto"}</span>
                </div>
                <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" disabled={loading} />
              </label>
            </div>
          </div>

          <FigmaInput
            type="password"
            name="senha"
            label="Senha *"
            placeholder="********"
            value={formData.senha}
            onChange={handleChange}
            icon={Lock}
            disabled={loading}
            invalid={errors.some((error) => error.includes("Senha"))}
            required
          />

          <FigmaInput
            type="password"
            name="confirmarSenha"
            label="Confirmar senha *"
            placeholder="********"
            value={formData.confirmarSenha}
            onChange={handleChange}
            icon={Lock}
            disabled={loading}
            invalid={errors.some((error) => error.includes("senhas"))}
            required
          />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <label className="group flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={lgpdConsent}
              onChange={(event) => {
                setLgpdConsent(event.target.checked);
                clearErrors();
              }}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={loading}
              required
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Aceito o tratamento dos meus dados pessoais conforme a LGPD *
              <button
                type="button"
                onClick={() => setLgpdModalOpen(true)}
                className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
              >
                <Info className="h-4 w-4" />
                Saiba mais
              </button>
            </span>
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <Link href="/login" className="flex-1">
            <FigmaButton type="button" variant="secondary" className="w-full" disabled={loading}>
              Voltar
            </FigmaButton>
          </Link>
          <FigmaButton type="submit" className="flex-1" loading={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </FigmaButton>
        </div>
      </form>

      <FigmaModal isOpen={lgpdModalOpen} onClose={() => setLgpdModalOpen(false)} title="Consentimento LGPD" size="md">
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            Ao utilizar o SIGAP, voce concorda com a coleta e tratamento dos seus dados pessoais (nome, email, CPF,
            matricula e foto) para as seguintes finalidades:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Identificacao e autenticacao no sistema</li>
            <li>Controle de acesso e permissoes</li>
            <li>Registro de solicitacoes de devolucao</li>
            <li>Auditoria de operacoes</li>
          </ul>
          <p>Seus dados serao armazenados de forma segura e nao serao compartilhados com terceiros sem autorizacao.</p>
          <FigmaButton type="button" onClick={() => setLgpdModalOpen(false)} className="w-full">
            Entendi
          </FigmaButton>
        </div>
      </FigmaModal>
    </>
  );
}
