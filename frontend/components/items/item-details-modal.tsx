"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, HandHeart, ImageIcon, KeyRound, MapPin, Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { Item } from "@/lib/types";
import { formatDate, getItemImageUrls } from "@/lib/utils";

const categories = ["Documentos", "Eletronicos", "Material escolar", "Vestuario", "Acessorios", "Outros"];
const turnos = [
  { value: "", label: "Nao informado" },
  { value: "manha", label: "Manha" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" }
];
const allowedTypes = ["image/jpeg", "image/png"];
const maxFileSize = 5 * 1024 * 1024;

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
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimChecked, setClaimChecked] = useState(false);
  const [collectionCode, setCollectionCode] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    nome_item: "",
    descricao: "",
    categoria: "",
    local_encontrado: "",
    data_achado: "",
    turno: ""
  });

  useEffect(() => {
    if (!item) {
      return;
    }

    setForm({
      nome_item: item.nome_item || "",
      descricao: item.descricao || "",
      categoria: item.categoria || "",
      local_encontrado: item.local_encontrado || "",
      data_achado: item.data_achado ? item.data_achado.slice(0, 10) : "",
      turno: item.turno || ""
    });
    setIsEditing(false);
    setConfirmDelete(false);
    setClaimChecked(false);
    setCollectionCode("");
    setImageFiles([]);
  }, [item]);

  const imageUrls = useMemo(() => getItemImageUrls(item?.imagens_urls, item?.imagem_url), [item]);

  if (!item) {
    return null;
  }

  const isBaseUser = user?.role === "user";
  const canClaim = isBaseUser && item.status === "achado";
  const canMarkInfo = item.status === "perdido" && item.cadastrado_por_id === user?.id;

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      setImageFiles([]);
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

    setImageFiles(files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!item || isSaving || !canManage) {
      return;
    }

    if (form.nome_item.trim().length < 2 || form.descricao.trim().length < 5 || !form.categoria || !form.local_encontrado.trim() || !form.data_achado) {
      toast.error("Nome, descrição, categoria, local e data são obrigatórios.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = imageFiles.length ? new FormData() : {
        nome_item: form.nome_item.trim(),
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        local_encontrado: form.local_encontrado.trim(),
        data_achado: form.data_achado,
        turno: (form.turno || null) as Item["turno"]
      };

      if (payload instanceof FormData) {
        payload.append("nome_item", form.nome_item.trim());
        payload.append("descricao", form.descricao.trim());
        payload.append("categoria", form.categoria);
        payload.append("local_encontrado", form.local_encontrado.trim());
        payload.append("data_achado", form.data_achado);
        payload.append("turno", form.turno);
        imageFiles.forEach((file) => payload.append("imagens", file));
      }

      const response = await itensApi.update(item.id, payload);
      toast.success("Item atualizado com sucesso.");
      onUpdated(response.item);
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível atualizar o item."));
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
      toast.success("Item excluído permanentemente.");
      onDeleted(item.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível excluir o item."));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleClaimItem() {
    if (!item || isClaiming || !claimChecked) {
      return;
    }

    setIsClaiming(true);

    try {
      const response = await itensApi.requestReturn(item.id);
      onUpdated(response.item);
      setCollectionCode(response.codigo_coleta || "");
      toast.success("Código de coleta gerado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível gerar o código de coleta."));
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 w-full max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6 dark:border-gray-700">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{item.nome_item}</h2>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} />
                {item.local_encontrado || "Local não informado"}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={15} />
                {formatDate(item.data_achado)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            {imageUrls.length ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                  <img src={imageUrls[0]} alt={item.nome_item} className="h-full min-h-80 w-full object-cover" />
                </div>
                {imageUrls.length > 1 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {imageUrls.slice(1).map((url, index) => (
                      <img key={url} src={url} alt={`${item.nome_item} ${index + 2}`} className="aspect-square rounded-lg object-cover" />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex min-h-80 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-700">
                <ImageIcon className="mr-2 h-5 w-5" />
                Sem imagem
              </div>
            )}
          </div>

          {canManage && isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput label="Nome" value={form.nome_item} onChange={(value) => setForm((current) => ({ ...current, nome_item: value }))} disabled={isSaving} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="sigap-label">Categoria</span>
                  <select className="sigap-input" value={form.categoria} onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))} disabled={isSaving} required>
                    <option value="">Selecione</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="sigap-label">Turno</span>
                  <select className="sigap-input" value={form.turno} onChange={(event) => setForm((current) => ({ ...current, turno: event.target.value }))} disabled={isSaving}>
                    {turnos.map((turno) => (
                      <option key={turno.value} value={turno.value}>{turno.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput label="Local" value={form.local_encontrado} onChange={(value) => setForm((current) => ({ ...current, local_encontrado: value }))} disabled={isSaving} />
                <FormInput type="date" label="Data" value={form.data_achado} onChange={(value) => setForm((current) => ({ ...current, data_achado: value }))} disabled={isSaving} />
              </div>

              <label className="space-y-2">
                <span className="sigap-label">Descrição</span>
                <textarea className="sigap-input min-h-24 resize-y" value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} disabled={isSaving} required />
              </label>

              <label className="space-y-2">
                <span className="sigap-label">Adicionar/substituir imagens</span>
                <input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageChange} className="sigap-input" disabled={isSaving} />
                {imageFiles.length ? <span className="text-xs text-gray-500">{imageFiles.length} imagem(ns) selecionada(s)</span> : null}
              </label>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70" disabled={isSaving}>
                  <Save size={17} />
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </button>
                <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBox label="Local" value={item.local_encontrado || "Não informado"} />
                <InfoBox label="Data" value={formatDate(item.data_achado)} />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</p>
                  <div className="mt-2"><StatusBadge status={item.status} /></div>
                </div>
              </div>

              <InfoBox label="Categoria" value={item.categoria || "Não informada"} />
              {item.turno ? <InfoBox label="Turno" value={turnos.find((turno) => turno.value === item.turno)?.label || item.turno} /> : null}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Descrição</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.descricao || "Descrição não informada."}</p>
              </div>

              {collectionCode ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <KeyRound className="h-5 w-5" />
                    Código de coleta gerado
                  </div>
                  <p className="text-3xl font-bold tracking-[0.35em]">{collectionCode}</p>
                  <p className="mt-2 text-sm">Leve este código ao local de coleta e apresente ao responsável pela entrega. Ele é de uso único.</p>
                </div>
              ) : null}

              {!canManage ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  {item.status === "achado" ? "Se este item for seu, marque a opção abaixo para gerar um código de coleta." : null}
                  {item.status === "perdido" ? "Este item foi reportado como perdido por um usuário do sistema." : null}
                  {item.status === "aguardando_coleta" ? "Este item já possui uma solicitação de coleta em andamento." : null}
                  {item.status === "devolvido" ? "Este item já consta como devolvido no sistema." : null}
                </div>
              ) : null}

              {canClaim ? (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <input type="checkbox" checked={claimChecked} onChange={(event) => setClaimChecked(event.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" disabled={isClaiming || Boolean(collectionCode)} />
                    É meu item
                  </label>
                  <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60" onClick={handleClaimItem} disabled={isClaiming || !claimChecked || Boolean(collectionCode)}>
                    <HandHeart size={17} />
                    {isClaiming ? "Gerando..." : "Gerar código de coleta"}
                  </button>
                </div>
              ) : null}

              {canMarkInfo ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  Esse item foi cadastrado por você como perdido. Caso já tenha encontrado, use a tela Minhas solicitações para atualizar o status.
                </div>
              ) : null}

              {canManage ? (
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => setIsEditing(true)}>
                    <Pencil size={17} />
                    Editar
                  </button>
                  <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2 size={17} />
                    {isDeleting ? "Excluindo..." : confirmDelete ? "Confirmar exclusão" : "Excluir"}
                  </button>
                </div>
              ) : (
                <button type="button" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" onClick={onClose}>
                  Fechar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  disabled,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="sigap-label">{label}</span>
      <input type={type} className="sigap-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required />
    </label>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
