"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Package, Upload } from "lucide-react";
import { toast } from "sonner";
import { FigmaButton, FigmaCard, FigmaInput, FigmaModal, FigmaSelect, FigmaTextarea } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, lostItemsApi } from "@/lib/api";
import type { Item } from "@/lib/types";
import { formatDate, getItemImageUrl } from "@/lib/utils";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png"];
const categories = ["Documentos", "Eletronicos", "Material escolar", "Vestuario", "Acessorios", "Outros"];
const locations = [
  "Patio central",
  "Biblioteca",
  "Laboratorios do Monte Castelo",
  "Cantina",
  "Secretaria academica",
  "Auditorio principal"
];
const turnos = [
  { value: "manha", label: "Manha" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" }
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
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [checkingMatches, setCheckingMatches] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);

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
      toast.error("Por favor, selecione uma imagem valida.");
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
      nextErrors.push("Nome do objeto e obrigatorio.");
    }

    if (!form.categoria) {
      nextErrors.push("Categoria e obrigatoria.");
    }

    if (!form.data_perda) {
      nextErrors.push("Data do sumico e obrigatoria.");
    }

    if (!form.turno) {
      nextErrors.push("Turno e obrigatorio.");
    }

    if (!form.local_provavel) {
      nextErrors.push("Local provavel e obrigatorio.");
    }

    if (form.caracteristicas.trim().length < 5) {
      nextErrors.push("Caracteristicas marcantes sao obrigatorias.");
    }

    return nextErrors;
  }

  async function saveAlert() {
    const data = new FormData();
    data.append("nome_item", form.nome_item.trim());
    data.append("categoria", form.categoria);
    data.append("data_perda", form.data_perda);
    data.append("turno", form.turno);
    data.append("local_provavel", form.local_provavel);
    data.append("caracteristicas", form.caracteristicas.trim());

    if (imageFile) {
      data.append("imagem", imageFile);
    }

    await lostItemsApi.create(data);
    toast.success("Alerta cadastrado com sucesso.");
    router.push("/requests");
  }

  async function checkMatches() {
    setCheckingMatches(true);

    try {
      const matches = await lostItemsApi.matches({
        nome_item: form.nome_item.trim(),
        categoria: form.categoria,
        local_provavel: form.local_provavel,
        caracteristicas: form.caracteristicas.trim()
      });

      if (matches.length > 0) {
        setMatchedItems(matches);
        setShowMatchModal(true);
      } else {
        await saveAlert();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao verificar itens."));
    } finally {
      setCheckingMatches(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || checkingMatches) {
      return;
    }

    const nextErrors = validateForm();

    if (nextErrors.length) {
      setErrors(nextErrors);
      toast.error("Revise os campos obrigatorios.");
      return;
    }

    setErrors([]);
    await checkMatches();
  }

  async function continueSavingAlert() {
    setLoading(true);

    try {
      await saveAlert();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao cadastrar alerta."));
    } finally {
      setLoading(false);
      setShowMatchModal(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <FigmaCard className="sticky top-24 p-6">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Imagem (opcional)</h3>

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
                <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  <Upload className="h-5 w-5" />
                  <span>{imageFile ? "Alterar imagem" : "Adicionar imagem"}</span>
                </div>
                <input type="file" accept="image/jpeg,image/png" onChange={handleImageChange} className="hidden" disabled={loading || checkingMatches} />
              </label>

              {imageFile ? <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{imageFile.name}</p> : null}
            </FigmaCard>
          </div>

          <div className="lg:col-span-2">
            <FigmaCard className="p-6">
              <h3 className="mb-6 font-semibold text-gray-900 dark:text-white">Informacoes do item perdido</h3>

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
                  label="Nome/Titulo do objeto *"
                  placeholder="Ex: Carteira marrom"
                  value={form.nome_item}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, nome_item: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading || checkingMatches}
                  invalid={errors.some((error) => error.includes("Nome"))}
                  required
                />

                <FigmaSelect
                  label="Categoria *"
                  value={form.categoria}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, categoria: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading || checkingMatches}
                  invalid={errors.some((error) => error.includes("Categoria"))}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </FigmaSelect>

                <FigmaInput
                  type="date"
                  label="Data do sumico *"
                  value={form.data_perda}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, data_perda: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading || checkingMatches}
                  invalid={errors.some((error) => error.includes("Data"))}
                  required
                />

                <FigmaSelect
                  label="Turno *"
                  value={form.turno}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, turno: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading || checkingMatches}
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

                <FigmaSelect
                  label="Local provavel *"
                  value={form.local_provavel}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, local_provavel: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading || checkingMatches}
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

                <FigmaTextarea
                  label="Caracteristicas marcantes *"
                  placeholder="Descreva cores, marcas, estado, detalhes que ajudem a identificar o item..."
                  rows={4}
                  value={form.caracteristicas}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, caracteristicas: event.target.value }));
                    clearErrors();
                  }}
                  disabled={loading || checkingMatches}
                  invalid={errors.some((error) => error.includes("Caracteristicas"))}
                  required
                />

                <div className="flex gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
                  <FigmaButton type="button" variant="secondary" onClick={() => router.push("/")} className="flex-1" disabled={loading || checkingMatches}>
                    Cancelar
                  </FigmaButton>
                  <FigmaButton type="submit" className="flex-1" loading={checkingMatches || loading}>
                    {checkingMatches ? "Verificando..." : loading ? "Salvando..." : "Cadastrar alerta"}
                  </FigmaButton>
                </div>
              </div>
            </FigmaCard>
          </div>
        </div>
      </form>

      <FigmaModal isOpen={showMatchModal} onClose={() => setShowMatchModal(false)} title="Itens parecidos encontrados" size="lg">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Encontramos itens parecidos com o que voce descreveu. Veja se algum deles e o seu antes de salvar o alerta.
            </p>
          </div>

          <div className="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
            {matchedItems.map((item) => {
              const imageUrl = getItemImageUrl(item.imagem_url);

              return (
                <FigmaCard key={item.id} className="p-4">
                  {imageUrl ? <img src={imageUrl} alt={item.nome_item} className="mb-3 h-32 w-full rounded-lg object-cover" /> : null}
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">{item.nome_item}</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>{item.categoria}</p>
                    <p>Local: {item.local_encontrado || "Nao informado"}</p>
                    <p>Data: {formatDate(item.data_achado)}</p>
                  </div>
                </FigmaCard>
              );
            })}
          </div>

          <div className="flex gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <FigmaButton type="button" variant="secondary" onClick={() => router.push("/")} className="flex-1">
              Ver vitrine de achados
            </FigmaButton>
            <FigmaButton type="button" onClick={continueSavingAlert} loading={loading} className="flex-1">
              {loading ? "Salvando..." : "Nao e meu item, salvar alerta"}
            </FigmaButton>
          </div>
        </div>
      </FigmaModal>
    </>
  );
}
