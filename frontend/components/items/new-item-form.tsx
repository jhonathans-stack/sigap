"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Upload } from "lucide-react";
import { toast } from "sonner";
import { FigmaButton, FigmaCard, FigmaInput, FigmaSelect, FigmaTextarea } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, itensApi } from "@/lib/api";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];
const categories = [
  { value: "Documentos", label: "Documentos" },
  { value: "Eletronicos", label: "Eletronicos" },
  { value: "Material escolar", label: "Material escolar" },
  { value: "Vestuario", label: "Vestuario" },
  { value: "Acessorios", label: "Acessorios" },
  { value: "Outros", label: "Outros" }
];
const locations = [
  "Patio central",
  "Biblioteca",
  "Laboratorios do Monte Castelo",
  "Cantina",
  "Secretaria academica",
  "Auditorio principal"
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
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
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
      setImagePreview("");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Por favor, selecione uma imagem valida (JPG ou PNG).");
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
    clearErrors();
  }

  function validateForm() {
    const nextErrors: string[] = [];

    if (form.nome_item.trim().length < 2) {
      nextErrors.push("Nome do item e obrigatorio.");
    }

    if (form.descricao.trim().length < 5) {
      nextErrors.push("Descricao e obrigatoria.");
    }

    if (!form.categoria) {
      nextErrors.push("Categoria e obrigatoria.");
    }

    if (!form.local_encontrado) {
      nextErrors.push("Local encontrado e obrigatorio.");
    }

    if (!form.data_achado) {
      nextErrors.push("Data do achado e obrigatoria.");
    }

    if (!imageFile) {
      nextErrors.push("Imagem do item e obrigatoria.");
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
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
    formData.append("categoria", form.categoria);
    formData.append("local_encontrado", form.local_encontrado);
    formData.append("data_achado", form.data_achado);
    formData.append("status", "achado");

    if (imageFile) {
      formData.append("imagem", imageFile);
    }

    setLoading(true);

    try {
      await itensApi.create(formData);
      toast.success("Item cadastrado com sucesso.");
      router.replace("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao cadastrar item."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <FigmaCard className="sticky top-24 p-6">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Imagem do item</h3>

            <div className="mb-4">
              {imagePreview ? (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700">
                <Upload className="h-5 w-5" />
                <span>{imageFile ? "Alterar imagem" : "Selecionar imagem"}</span>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageChange} className="hidden" required disabled={loading} />
            </label>

            {imageFile ? <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{imageFile.name}</p> : null}
          </FigmaCard>
        </div>

        <div className="lg:col-span-2">
          <FigmaCard className="p-6">
            <h3 className="mb-6 font-semibold text-gray-900 dark:text-white">Informacoes do item</h3>

            <div className="space-y-6">
              {errors.length ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
                  {errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              ) : null}

              <FigmaInput
                type="text"
                name="nome_item"
                label="Nome do item *"
                placeholder="Ex: Carteira marrom"
                value={form.nome_item}
                onChange={(event) => {
                  setForm((current) => ({ ...current, nome_item: event.target.value }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Nome"))}
                required
              />

              <FigmaTextarea
                name="descricao"
                label="Descricao *"
                placeholder="Descreva caracteristicas, marcas, estado de conservacao..."
                rows={4}
                value={form.descricao}
                onChange={(event) => {
                  setForm((current) => ({ ...current, descricao: event.target.value }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Descricao"))}
                required
              />

              <FigmaSelect
                name="categoria"
                label="Categoria *"
                value={form.categoria}
                onChange={(event) => {
                  setForm((current) => ({ ...current, categoria: event.target.value }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Categoria"))}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </FigmaSelect>

              <FigmaSelect
                name="local_encontrado"
                label="Local encontrado *"
                value={form.local_encontrado}
                onChange={(event) => {
                  setForm((current) => ({ ...current, local_encontrado: event.target.value }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Local"))}
                required
              >
                <option value="">Selecione o local</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </FigmaSelect>

              <FigmaInput
                type="date"
                name="data_achado"
                label="Data do achado *"
                value={form.data_achado}
                onChange={(event) => {
                  setForm((current) => ({ ...current, data_achado: event.target.value }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Data"))}
                required
              />

              <div className="flex gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
                <FigmaButton type="button" variant="secondary" onClick={() => router.push("/")} className="flex-1" disabled={loading}>
                  Cancelar
                </FigmaButton>
                <FigmaButton type="submit" className="flex-1" loading={loading}>
                  {loading ? "Salvando..." : "Salvar item"}
                </FigmaButton>
              </div>
            </div>
          </FigmaCard>
        </div>
      </div>
    </form>
  );
}
