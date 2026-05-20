"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, HandHeart, MapPin, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
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
  const [isRequesting, setIsRequesting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { user } = useAuth();

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
  const canConfirmReceipt = item.status === "aguardando_retirada" && item.solicitado_por_id === user?.id;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item || isSaving || !canManage) {
      return;
    }

    if (form.nome_item.trim().length < 2 || form.descricao.trim().length < 5 || !form.categoria.trim() || !form.local_encontrado.trim()) {
      toast.error("Nome, descricao, categoria e local sao obrigatorios.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Partial<Item> = {
        nome_item: form.nome_item.trim(),
        descricao: form.descricao.trim(),
        categoria: form.categoria.trim(),
        local_encontrado: form.local_encontrado.trim()
      };

      if (form.status !== "entregue") {
        payload.status = form.status;
      }

      const response = await itensApi.update(item.id, payload);
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

  async function handleRequestReturn() {
    if (!item || isRequesting) {
      return;
    }

    setIsRequesting(true);

    try {
      const response = await itensApi.requestReturn(item.id);
      toast.success("Solicitacao registrada. Aguarde a separacao pela equipe.");
      onUpdated(response.item);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel solicitar a devolucao."));
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleConfirmReceipt() {
    if (!item || isRequesting) {
      return;
    }

    setIsRequesting(true);

    try {
      const response = await itensApi.confirmReceipt(item.id);
      toast.success("Recebimento confirmado.");
      onUpdated(response.item);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel confirmar o recebimento."));
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-4">
      <div className="mx-auto my-8 w-full max-w-5xl rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
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
                <label htmlFor="edit-nome" className="sigap-label">Nome</label>
                <input id="edit-nome" className="sigap-input" value={form.nome_item} onChange={(event) => setForm((current) => ({ ...current, nome_item: event.target.value }))} disabled={isSaving || isDeleting} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="edit-categoria" className="sigap-label">Categoria</label>
                  <input id="edit-categoria" className="sigap-input" value={form.categoria} onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))} disabled={isSaving || isDeleting} required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-status" className="sigap-label">Situacao</label>
                  <select id="edit-status" className="sigap-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ItemStatus }))} disabled={isSaving || isDeleting}>
                    <option value="achado">Aguardando coleta</option>
                    <option value="aguardando_retirada">Aguardando retirada</option>
                    {form.status === "entregue" ? <option value="entregue">Devolvido</option> : null}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-local" className="sigap-label">Local encontrado</label>
                <input id="edit-local" className="sigap-input" value={form.local_encontrado} onChange={(event) => setForm((current) => ({ ...current, local_encontrado: event.target.value }))} disabled={isSaving || isDeleting} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-descricao" className="sigap-label">Descricao</label>
                <textarea id="edit-descricao" className="sigap-input min-h-24 resize-y" value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} disabled={isSaving || isDeleting} required />
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
                Para concluir a devolucao, altere a situacao para "Aguardando retirada". O item so vira "Devolvido" depois que o usuario confirmar o recebimento.
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" className="sigap-primary flex-1" disabled={isSaving || isDeleting}>
                  <Save size={17} />
                  {isSaving ? "Salvando..." : "Salvar alteracoes"}
                </button>
                <button type="button" className="sigap-danger flex-1" onClick={handleDelete} disabled={isSaving || isDeleting}>
                  <Trash2 size={17} />
                  {isDeleting ? "Excluindo..." : confirmDelete ? "Confirmar exclusao" : "Excluir"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBox label="Local" value={item.local_encontrado || "Nao informado"} />
                <InfoBox label="Data do achado" value={formatDate(item.data_achado)} />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Situacao</p>
                  <div className="mt-2"><StatusBadge status={item.status} /></div>
                </div>
              </div>

              <InfoBox label="Categoria" value={item.categoria || "Nao informada"} />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Descricao</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.descricao || "Descricao nao informada."}</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
                {item.status === "achado" ? "Proximo passo: solicite a devolucao pelo sistema e aguarde a separacao pela secretaria." : null}
                {item.status === "aguardando_retirada" && canConfirmReceipt ? "Proximo passo: retire o item na secretaria e confirme o recebimento abaixo." : null}
                {item.status === "aguardando_retirada" && !canConfirmReceipt ? "Este item ja esta aguardando retirada por uma solicitacao em andamento." : null}
                {item.status === "entregue" ? "Este item ja consta como devolvido no sistema." : null}
              </div>

              {item.status === "achado" ? (
                <button type="button" className="sigap-primary w-full" onClick={handleRequestReturn} disabled={isRequesting}>
                  <HandHeart size={17} />
                  {isRequesting ? "Solicitando..." : "Solicitar devolucao"}
                </button>
              ) : null}

              {canConfirmReceipt ? (
                <button type="button" className="sigap-primary w-full" onClick={handleConfirmReceipt} disabled={isRequesting}>
                  <CheckCircle2 size={17} />
                  {isRequesting ? "Confirmando..." : "Confirmar recebimento"}
                </button>
              ) : null}

              <button type="button" className="sigap-secondary w-full" onClick={onClose}>Fechar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
