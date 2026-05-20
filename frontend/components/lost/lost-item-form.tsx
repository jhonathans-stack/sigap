"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarDays, FileSearch, ImagePlus, MapPin, Save, SearchCheck, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { getApiErrorMessage, lostItemsApi } from "@/lib/api";
import type { Item } from "@/lib/types";
import { formatDate, getItemImageUrl } from "@/lib/utils";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];
const categoryOptions = ["documentos", "eletronicos", "material escolar", "vestuario", "acessorios", "outros"];
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
  categoria: "",
  data_perda: "",
  turno: "",
  local_provavel: "",
  caracteristicas: ""
};

export function LostItemForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingMatches, setIsCheckingMatches] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [matches, setMatches] = useState<Item[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [confirmedNoMatch, setConfirmedNoMatch] = useState(false);

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

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validateForm() {
    const nextErrors: string[] = [];

    if (form.nome_item.trim().length < 2) {
      nextErrors.push("Informe o nome ou titulo do objeto.");
    }

    if (!form.categoria) {
      nextErrors.push("Selecione uma categoria.");
    }

    if (!form.data_perda) {
      nextErrors.push("Informe a data do sumico.");
    }

    if (!form.turno) {
      nextErrors.push("Selecione o turno do sumico.");
    }

    if (!form.local_provavel) {
      nextErrors.push("Selecione o local provavel.");
    }

    if (form.caracteristicas.trim().length < 5) {
      nextErrors.push("Descreva uma caracteristica marcante do objeto.");
    }

    return nextErrors;
  }

  async function saveLostRequest() {
    const formData = new FormData();
    formData.append("nome_item", form.nome_item.trim());
    formData.append("categoria", form.categoria);
    formData.append("data_perda", form.data_perda);
    formData.append("turno", form.turno);
    formData.append("local_provavel", form.local_provavel);
    formData.append("caracteristicas", form.caracteristicas.trim());

    if (imageFile) {
      formData.append("imagem", imageFile);
    }

    const response = await lostItemsApi.create(formData);
    toast.success(response.mensagem || "Alerta cadastrado com sucesso.");
    router.replace("/requests");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isCheckingMatches) {
      return;
    }

    const nextErrors = validateForm();

    if (nextErrors.length) {
      setErrors(nextErrors);
      toast.error("Revise os campos obrigatorios.");
      return;
    }

    if (!confirmedNoMatch) {
      setIsCheckingMatches(true);

      try {
        const foundMatches = await lostItemsApi.matches({
          nome_item: form.nome_item.trim(),
          categoria: form.categoria,
          local_provavel: form.local_provavel,
          caracteristicas: form.caracteristicas.trim()
        });

        if (foundMatches.length) {
          setMatches(foundMatches);
          setShowMatchModal(true);
          return;
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Nao foi possivel verificar itens parecidos."));
      } finally {
        setIsCheckingMatches(false);
      }
    }

    setIsSubmitting(true);

    try {
      await saveLostRequest();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel cadastrar o alerta."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function continueAfterMatches() {
    setConfirmedNoMatch(true);
    setShowMatchModal(false);
    setIsSubmitting(true);

    try {
      await saveLostRequest();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel cadastrar o alerta."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="sigap-surface overflow-hidden rounded-lg" noValidate>
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        <div className="grid gap-6 p-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-dashed border-blue-200 bg-blue-50/70 dark:border-blue-900/70 dark:bg-blue-950/20">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview do objeto perdido" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                  <ImagePlus size={44} />
                  <span className="text-sm font-semibold">Imagem opcional</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="lost-image" className="sigap-label">
                Upload de imagem
              </label>
              <input
                id="lost-image"
                type="file"
                accept="image/jpeg,image/png"
                className="sigap-input"
                onChange={handleImageChange}
                disabled={isSubmitting || isCheckingMatches}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Opcional. Use JPG ou PNG com ate 5MB.</p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100">
              Ao cadastrar o alerta, o SIGAP verifica automaticamente se ja existe um item parecido registrado como achado.
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

            <label className="space-y-2">
              <span className="sigap-label">Nome ou titulo do objeto</span>
              <input
                className="sigap-input"
                value={form.nome_item}
                onChange={(event) => {
                  setForm((current) => ({ ...current, nome_item: event.target.value }));
                  clearErrors();
                }}
                placeholder="Ex.: Caderno de 10 materias"
                disabled={isSubmitting || isCheckingMatches}
                required
                aria-invalid={errors.some((error) => error.includes("nome"))}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="sigap-label">Categoria</span>
                <select
                  className="sigap-input"
                  value={form.categoria}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, categoria: event.target.value }));
                    clearErrors();
                  }}
                  disabled={isSubmitting || isCheckingMatches}
                  required
                  aria-invalid={errors.some((error) => error.includes("categoria"))}
                >
                  <option value="">Selecione</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="sigap-label">Data do sumico</span>
                <span className="relative block">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    className="sigap-input pl-10"
                    value={form.data_perda}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, data_perda: event.target.value }));
                      clearErrors();
                    }}
                    disabled={isSubmitting || isCheckingMatches}
                    required
                    aria-invalid={errors.some((error) => error.includes("data"))}
                  />
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="sigap-label">Turno</span>
                <select
                  className="sigap-input"
                  value={form.turno}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, turno: event.target.value }));
                    clearErrors();
                  }}
                  disabled={isSubmitting || isCheckingMatches}
                  required
                  aria-invalid={errors.some((error) => error.includes("turno"))}
                >
                  <option value="">Selecione</option>
                  <option value="manha">Manha</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="sigap-label">Local provavel</span>
                <span className="relative block">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    className="sigap-input pl-10"
                    value={form.local_provavel}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, local_provavel: event.target.value }));
                      clearErrors();
                    }}
                    disabled={isSubmitting || isCheckingMatches}
                    required
                    aria-invalid={errors.some((error) => error.includes("local"))}
                  >
                    <option value="">Selecione</option>
                    {locationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <label className="space-y-2">
              <span className="sigap-label">Caracteristicas marcantes</span>
              <textarea
                className="sigap-input min-h-28 resize-y"
                value={form.caracteristicas}
                onChange={(event) => {
                  setForm((current) => ({ ...current, caracteristicas: event.target.value }));
                  clearErrors();
                }}
                placeholder="Ex.: Tem um adesivo do Batman na capa"
                disabled={isSubmitting || isCheckingMatches}
                required
                aria-invalid={errors.some((error) => error.includes("caracteristica"))}
              />
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/" className="sigap-secondary flex-1">
                <ArrowLeft size={17} />
                Voltar
              </Link>
              <button type="submit" className="sigap-primary flex-1" disabled={isSubmitting || isCheckingMatches}>
                {isCheckingMatches ? <SearchCheck size={17} className="animate-pulse" /> : <Save size={17} />}
                {isCheckingMatches ? "Verificando..." : isSubmitting ? "Salvando..." : "Cadastrar alerta"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {showMatchModal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
          <div className="mx-auto my-8 max-w-5xl rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={18} />
                  Pre-match imediato
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Encontramos itens parecidos</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Veja se algum deles parece ser o seu antes de salvar o alerta.
                </p>
              </div>
              <button type="button" className="sigap-secondary h-9 w-9 px-0" onClick={() => setShowMatchModal(false)} aria-label="Fechar">
                <X size={17} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto p-5">
              {matches.map((item) => {
                const imageUrl = getItemImageUrl(item.imagem_url);

                return (
                  <article key={item.id} className="min-w-[260px] rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.nome_item} className="aspect-[4/3] w-full rounded-lg object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-200 text-sm text-slate-500 dark:bg-slate-800">Sem imagem</div>
                    )}
                    <h3 className="mt-3 line-clamp-1 text-base font-black text-slate-950 dark:text-white">{item.nome_item}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.categoria || "Sem categoria"}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(item.data_achado)}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:justify-end">
              <Link href="/" className="sigap-secondary">
                <FileSearch size={17} />
                Ver vitrine de achados
              </Link>
              <button type="button" className="sigap-primary" onClick={continueAfterMatches} disabled={isSubmitting}>
                <Save size={17} />
                {isSubmitting ? "Salvando..." : "Nao e meu item, salvar alerta"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
