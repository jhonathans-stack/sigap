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
  "Auditorio principal",
  "Outros"
];
const turnos = [
  { value: "manha", label: "Manha" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" }
];

const emptyForm = {
  nome_item: "",
  descricao: "",
  categoria: "",
  local_encontrado: "",
  local_outro: "",
  data_achado: "",
  turno: ""
};

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBrazilianDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T00:00:00`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() + 1 !== Number(month) ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return iso;
}

function todayKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function NewItemForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  function clearErrors() {
    if (errors.length) {
      setErrors([]);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    if (files.length > 5) {
      toast.error("Selecione no máximo 5 imagens.");
      event.target.value = "";
      return;
    }

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      toast.error("Selecione apenas imagens JPG ou PNG.");
      event.target.value = "";
      return;
    }

    if (files.some((file) => file.size > maxFileSize)) {
      toast.error("Cada imagem deve ter no máximo 5MB.");
      event.target.value = "";
      return;
    }

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
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
    } else if (form.local_encontrado === "Outros" && form.local_outro.trim().length < 3) {
      nextErrors.push("Informe o local encontrado.");
    }

    const isoDate = parseBrazilianDate(form.data_achado);
    if (!isoDate) {
      nextErrors.push("Data do achado deve estar no formato DD/MM/AAAA.");
    } else if (isoDate > todayKey()) {
      nextErrors.push("Data do achado nao pode ser futura.");
    }

    if (!form.turno) {
      nextErrors.push("Turno e obrigatorio.");
    }

    if (!imageFiles.length) {
      nextErrors.push("Ao menos uma imagem do item é obrigatória.");
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
    formData.append("local_encontrado", form.local_encontrado === "Outros" ? form.local_outro.trim() : form.local_encontrado);
    formData.append("data_achado", parseBrazilianDate(form.data_achado) || "");
    formData.append("turno", form.turno);
    formData.append("status", "achado");

    imageFiles.forEach((file) => formData.append("imagens", file));

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
              {imagePreviews.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
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
                  <span>{imageFiles.length ? "Alterar imagens" : "Selecionar imagens"}</span>
                </div>
              <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageChange} className="hidden" required disabled={loading} multiple />
            </label>

            {imageFiles.length ? <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{imageFiles.length} imagem(ns) selecionada(s)</p> : null}
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

              {form.local_encontrado === "Outros" ? (
                <FigmaTextarea
                  name="local_outro"
                  label="Descreva o local encontrado *"
                  placeholder="Informe o local com detalhes suficientes para identificacao..."
                  rows={3}
                  value={form.local_outro}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, local_outro: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading}
                  invalid={errors.some((error) => error.includes("local encontrado"))}
                  required
                />
              ) : null}

              <FigmaInput
                type="text"
                name="data_achado"
                label="Data do achado *"
                placeholder="DD/MM/AAAA"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                value={form.data_achado}
                onChange={(event) => {
                  setForm((current) => ({ ...current, data_achado: maskDate(event.target.value) }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Data"))}
                required
              />

              <FigmaSelect
                name="turno"
                label="Turno *"
                value={form.turno}
                onChange={(event) => {
                  setForm((current) => ({ ...current, turno: event.target.value }));
                  clearErrors();
                }}
                disabled={loading}
                invalid={errors.some((error) => error.includes("Turno"))}
                required
              >
                <option value="">Selecione o turno</option>
                {turnos.map((turno) => (
                  <option key={turno.value} value={turno.value}>
                    {turno.label}
                  </option>
                ))}
              </FigmaSelect>

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
