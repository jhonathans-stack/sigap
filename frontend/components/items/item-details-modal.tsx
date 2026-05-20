"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, MapPin, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { Item, ItemStatus } from "@/lib/types";
import { formatDate, getItemImageUrl } from "@/lib/utils";

export function ItemDetailsModal({
  item,
  canManage,
  onClose,
  onUpdated,
  onDeleted
}: {
  item: Item | null;
  canManage: boolean;
  onClose: () => void;
  onUpdated: (item: Item) => void;
  onDeleted: (id: number) => void;
}) {
  const [form, setForm] = useState({
    nome_item: "",
    descricao: "",
    categoria: "",
    local_encontrado: "",
    status: "achado" as ItemStatus,
    quem_retirou_nome: "",
    quem_retirou_documento: "",
    motivo_devolucao: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!item) {
      return;
    }

    setForm({
      nome_item: item.nome_item || "",
      descricao: item.descricao || "",
      categoria: item.categoria || "",
      local_encontrado: item.local_encontrado || "",
      status: item.status,
      quem_retirou_nome: item.quem_retirou_nome || "",
      quem_retirou_documento: item.quem_retirou_documento || "",
      motivo_devolucao: item.motivo_devolucao || ""
    });
    setConfirmDelete(false);
  }, [item]);

  if (!item) {
    return null;
  }

  const imageUrl = getItemImageUrl(item.imagem_url);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item || isSaving || !canManage) {
      return;
    }

    if (form.nome_item.trim().length < 2) {
      toast.error("Nome do item deve ter pelo menos 2 caracteres.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await itensApi.update(item.id, {
        ...form,
        data_entrega: form.status === "entregue" ? new Date().toISOString() : null
      });
      toast.success("Item atualizado com sucesso.");
      onUpdated(response.item);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel atualizar o item."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!item || isDeleting || !canManage) {
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);

    try {
      await itensApi.remove(item.id);
      toast.success("Item excluido permanentemente.");
      onDeleted(item.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel excluir o item."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-4">
      <div className="mx-auto my-8 w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">{item.nome_item}</h2>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} />
                {item.local_encontrado || "Local nao informado"}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={15} />
                {formatDate(item.data_achado)}
              </span>
            </div>
          </div>

          <button type="button" onClick={onClose} className="sigap-secondary h-9 w-9 px-0" aria-label="Fechar">
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
            {imageUrl ? (
              <img src={imageUrl} alt={item.nome_item} className="h-full min-h-80 w-full object-cover" />
            ) : (
              <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">Sem imagem</div>
            )}
          </div>

          {canManage ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-nome" className="sigap-label">
                  Nome
                </label>
                <input
                  id="edit-nome"
                  className="sigap-input"
                  value={form.nome_item}
                  onChange={(event) => setForm((current) => ({ ...current, nome_item: event.target.value }))}
                  disabled={isSaving || isDeleting}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="edit-categoria" className="sigap-label">
                    Categoria
                  </label>
                  <input
                    id="edit-categoria"
                    className="sigap-input"
                    value={form.categoria}
                    onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
                    disabled={isSaving || isDeleting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-status" className="sigap-label">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="sigap-input"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, status: event.target.value as ItemStatus }))
                    }
                    disabled={isSaving || isDeleting}
                  >
                    <option value="achado">achado</option>
                    <option value="entregue">entregue</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-local" className="sigap-label">
                  Local encontrado
                </label>
                <input
                  id="edit-local"
                  className="sigap-input"
                  value={form.local_encontrado}
                  onChange={(event) => setForm((current) => ({ ...current, local_encontrado: event.target.value }))}
                  disabled={isSaving || isDeleting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-descricao" className="sigap-label">
                  Descricao
                </label>
                <textarea
                  id="edit-descricao"
                  className="sigap-input min-h-24 resize-y"
                  value={form.descricao}
                  onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
                  disabled={isSaving || isDeleting}
                />
              </div>

              {form.status === "entregue" ? (
                <div className="grid gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/70 dark:bg-blue-950/30 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="retirou-nome" className="sigap-label">
                      Quem retirou
                    </label>
                    <input
                      id="retirou-nome"
                      className="sigap-input"
                      value={form.quem_retirou_nome}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, quem_retirou_nome: event.target.value }))
                      }
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="retirou-doc" className="sigap-label">
                      Documento
                    </label>
                    <input
                      id="retirou-doc"
                      className="sigap-input"
                      value={form.quem_retirou_documento}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, quem_retirou_documento: event.target.value }))
                      }
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="motivo" className="sigap-label">
                      Motivo da devolucao
                    </label>
                    <textarea
                      id="motivo"
                      className="sigap-input min-h-20"
                      value={form.motivo_devolucao}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, motivo_devolucao: event.target.value }))
                      }
                      disabled={isSaving || isDeleting}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" className="sigap-primary flex-1" disabled={isSaving || isDeleting}>
                  <Save size={17} />
                  {isSaving ? "Salvando..." : "Salvar alteracoes"}
                </button>
                <button
                  type="button"
                  className="sigap-danger flex-1"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 size={17} />
                  {isDeleting ? "Excluindo..." : confirmDelete ? "Confirmar exclusao" : "Excluir"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Categoria
                </p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{item.categoria || "Nao informada"}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Descricao
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {item.descricao || "Descricao nao informada."}
                </p>
              </div>

              {item.status === "entregue" ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/70 dark:bg-blue-950/30">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                    Devolucao
                  </p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                    <span>Retirado por: {item.quem_retirou_nome || "Nao informado"}</span>
                    <span>Documento: {item.quem_retirou_documento || "Nao informado"}</span>
                  </div>
                </div>
              ) : null}

              <button type="button" className="sigap-secondary w-full" onClick={onClose}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
