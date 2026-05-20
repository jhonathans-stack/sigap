"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { ItemStatus } from "@/lib/types";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];

export function NewItemForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome_item: "",
    descricao: "",
    categoria: "",
    local_encontrado: "",
    data_achado: "",
    status: "achado" as ItemStatus
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (form.nome_item.trim().length < 2) {
      toast.error("Nome do item deve ter pelo menos 2 caracteres.");
      return;
    }

    if (!form.categoria.trim()) {
      toast.error("Informe uma categoria.");
      return;
    }

    if (!imageFile) {
      toast.error("Selecione uma imagem JPG ou PNG.");
      return;
    }

    const formData = new FormData();
    formData.append("nome_item", form.nome_item.trim());
    formData.append("descricao", form.descricao.trim());
    formData.append("categoria", form.categoria.trim());
    formData.append("local_encontrado", form.local_encontrado.trim());
    formData.append("status", form.status);
    formData.append("imagem", imageFile);

    if (form.data_achado) {
      formData.append("data_achado", form.data_achado);
    }

    setIsSubmitting(true);

    try {
      await itensApi.create(formData);
      toast.success("Item cadastrado com sucesso.");
      router.push("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel cadastrar o item."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sigap-surface overflow-hidden rounded-lg">
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
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Apenas JPG ou PNG, com limite de 5MB.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nome-item" className="sigap-label">
              Nome
            </label>
            <input
              id="nome-item"
              className="sigap-input"
              value={form.nome_item}
              onChange={(event) => setForm((current) => ({ ...current, nome_item: event.target.value }))}
              placeholder="Ex.: Carteira preta"
              disabled={isSubmitting}
              required
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
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
              placeholder="Detalhes que ajudem na identificacao do item"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="categoria" className="sigap-label">
                Categoria
              </label>
              <input
                id="categoria"
                className="sigap-input"
                value={form.categoria}
                onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
                placeholder="documentos, eletronicos..."
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="sigap-label">
                Status
              </label>
              <select
                id="status"
                className="sigap-input"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ItemStatus }))}
                disabled={isSubmitting}
              >
                <option value="achado">achado</option>
                <option value="entregue">entregue</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="local" className="sigap-label">
                Local encontrado
              </label>
              <input
                id="local"
                className="sigap-input"
                value={form.local_encontrado}
                onChange={(event) => setForm((current) => ({ ...current, local_encontrado: event.target.value }))}
                placeholder="Ex.: Biblioteca"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="data-achado" className="sigap-label">
                Data do achado
              </label>
              <input
                id="data-achado"
                type="date"
                className="sigap-input"
                value={form.data_achado}
                onChange={(event) => setForm((current) => ({ ...current, data_achado: event.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/" className="sigap-secondary flex-1">
              <ArrowLeft size={17} />
              Voltar
            </Link>
            <button type="submit" className="sigap-primary flex-1" disabled={isSubmitting}>
              <Save size={17} />
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
