"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ImagePlus, MapPin, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getApiErrorMessage, itensApi } from "@/lib/api";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];
const itemCategoryOptions = ["documentos", "eletronicos", "material escolar", "vestuario", "acessorios", "outros"];
const locationOptions = [
  "Patio central",
  "Biblioteca",
  "Laboratorios do Monte Castelo",
  "Cantina",
  "Secretaria academica",
  "Auditorio principal",
  "Outro local"
];

const emptyForm = {
  nome_item: "",
  descricao: "",
  categoria: "",
  local_encontrado: "",
  data_achado: ""
};

export function NewItemForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function clearErrors() {
    if (errors.length) {
      setErrors([]);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("A imagem deve ser JPG ou PNG.");
      event.target.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      toast.error("A imagem deve ter no maximo 5MB.");
      event.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    clearErrors();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validateForm() {
    const nextErrors: string[] = [];

    if (form.nome_item.trim().length < 2) {
      nextErrors.push("Informe o nome do item com pelo menos 2 caracteres.");
    }

    if (form.descricao.trim().length < 5) {
      nextErrors.push("Informe uma descricao com pelo menos 5 caracteres.");
    }

    if (!form.categoria.trim()) {
      nextErrors.push("Selecione uma categoria.");
    }

    if (!form.local_encontrado.trim()) {
      nextErrors.push("Selecione o local onde o item foi encontrado.");
    }

    if (!form.data_achado) {
      nextErrors.push("Informe a data em que o item foi encontrado.");
    }

    if (!imageFile) {
      nextErrors.push("Selecione uma imagem JPG ou PNG do item.");
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateForm();

    if (nextErrors.length) {
      setErrors(nextErrors);
      toast.error("Revise os campos obrigatorios.");
      return;
    }

    const formData = new FormData();
    formData.append("nome_item", form.nome_item.trim());
    formData.append("descricao", form.descricao.trim());
    formData.append("categoria", form.categoria.trim());
    formData.append("local_encontrado", form.local_encontrado.trim());
    formData.append("data_achado", form.data_achado);
    formData.append("status", "achado");

    if (imageFile) {
      formData.append("imagem", imageFile);
    }

    setIsSubmitting(true);

    try {
      await itensApi.create(formData);
      toast.success("Item cadastrado com sucesso.");
      router.replace("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel cadastrar o item."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sigap-surface overflow-hidden rounded-lg" noValidate>
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
      <div className="grid gap-6 p-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-dashed border-blue-200 bg-blue-50/70 dark:border-blue-900/70 dark:bg-blue-950/20">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview do item" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                <ImagePlus size={44} />
                <span className="text-sm font-semibold">Preview da imagem</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="imagem" className="sigap-label">
              Upload de imagem
            </label>
            <input
              id="imagem"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="sigap-input"
              disabled={isSubmitting}
              required
              aria-invalid={errors.some((error) => error.includes("imagem"))}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Apenas JPG ou PNG, com limite de 5MB.</p>
          </div>
        </div>

        <div className="space-y-4">
          {errors.length ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="nome-item" className="sigap-label">
              Nome do item
            </label>
            <input
              id="nome-item"
              className="sigap-input"
              value={form.nome_item}
              onChange={(event) => {
                setForm((current) => ({ ...current, nome_item: event.target.value }));
                clearErrors();
              }}
              placeholder="Ex.: Carteira preta"
              disabled={isSubmitting}
              required
              aria-invalid={errors.some((error) => error.includes("nome"))}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="descricao" className="sigap-label">
              Descricao
            </label>
            <textarea
              id="descricao"
              className="sigap-input min-h-28 resize-y"
              value={form.descricao}
              onChange={(event) => {
                setForm((current) => ({ ...current, descricao: event.target.value }));
                clearErrors();
              }}
              placeholder="Detalhes que ajudem na identificacao do item"
              disabled={isSubmitting}
              required
              aria-invalid={errors.some((error) => error.includes("descricao"))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="categoria" className="sigap-label">
                Categoria
              </label>
              <select
                id="categoria"
                className="sigap-input"
                value={form.categoria}
                onChange={(event) => {
                  setForm((current) => ({ ...current, categoria: event.target.value }));
                  clearErrors();
                }}
                disabled={isSubmitting}
                required
                aria-invalid={errors.some((error) => error.includes("categoria"))}
              >
                <option value="">Selecione uma categoria</option>
                {itemCategoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="data-achado" className="sigap-label">
                Data do achado
              </label>
              <span className="relative block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="data-achado"
                  type="date"
                  className="sigap-input pl-10"
                  value={form.data_achado}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, data_achado: event.target.value }));
                    clearErrors();
                  }}
                  disabled={isSubmitting}
                  required
                  aria-invalid={errors.some((error) => error.includes("data"))}
                />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="local" className="sigap-label">
              Local encontrado
            </label>
            <span className="relative block">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                id="local"
                className="sigap-input pl-10"
                value={form.local_encontrado}
                onChange={(event) => {
                  setForm((current) => ({ ...current, local_encontrado: event.target.value }));
                  clearErrors();
                }}
                disabled={isSubmitting}
                required
                aria-invalid={errors.some((error) => error.includes("local"))}
              >
                <option value="">Selecione o local</option>
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/" className="sigap-secondary flex-1">
              <ArrowLeft size={17} />
              Voltar
            </Link>
            <button type="submit" className="sigap-primary flex-1" disabled={isSubmitting}>
              <Save size={17} />
              {isSubmitting ? "Salvando..." : "Salvar item"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
