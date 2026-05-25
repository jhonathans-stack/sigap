"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye, KeyRound, Package, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { FigmaButton, FigmaCard } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { Item } from "@/lib/types";
import { formatDate, getItemImageUrls } from "@/lib/utils";

type CollectionForm = {
  codigo: string;
};

const emptyForm: CollectionForm = {
  codigo: ""
};

export function CollectionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [forms, setForms] = useState<Record<number, CollectionForm>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);

    try {
      const data = await itensApi.listForCollection({ busca: search });
      setItems(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar itens para coleta."));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  function updateForm(itemId: number, value: string) {
    setForms((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || emptyForm),
        codigo: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
      }
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, item: Item) {
    event.preventDefault();

    const form = forms[item.id] || emptyForm;

    if (!/^[A-Z0-9]{6}$/.test(form.codigo)) {
      toast.error("Informe o código de coleta com 6 caracteres.");
      return;
    }

    setBusyId(item.id);

    try {
      await itensApi.confirmCollection(item.id, {
        codigo: form.codigo
      });
      toast.success("Coleta confirmada e relatório salvo.");
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setForms((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível confirmar a coleta."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Itens para coleta</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Valide o código apresentado pelo usuário e registre a entrega do item.
            </p>
          </div>
          <FigmaButton type="button" variant="secondary" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </FigmaButton>
        </div>

        <FigmaCard className="mb-8 p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              className="sigap-input pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value.toUpperCase())}
              placeholder="Buscar por código, item, categoria, local, nome, email ou matrícula"
            />
          </label>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Para concluir uma entrega, informe apenas o código de coleta. Os dados do solicitante são carregados automaticamente pelo sistema.
          </p>
        </FigmaCard>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <FigmaCard className="p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Nenhum item aguardando coleta</h3>
            <p className="text-gray-600 dark:text-gray-400">Quando um usuário marcar “É meu item”, o registro aparecerá aqui.</p>
          </FigmaCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => {
              const imageUrls = getItemImageUrls(item.imagens_urls, item.imagem_url);
              const imageUrl = imageUrls[0];
              const form = forms[item.id] || emptyForm;
              const isBusy = busyId === item.id;
              const expanded = Boolean(expandedItems[item.id]);
              const description = item.descricao || "Descrição não informada.";

              return (
                <FigmaCard key={item.id} className="overflow-hidden">
                  {imageUrl ? (
                    <button type="button" className="relative block h-56 w-full bg-gray-100 dark:bg-gray-800" onClick={() => setLightboxUrl(imageUrl)}>
                      <img src={imageUrl} alt={item.nome_item} className="h-full w-full object-cover" />
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                        <Eye className="h-4 w-4" />
                        Expandir
                      </span>
                    </button>
                  ) : null}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{item.nome_item}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.local_encontrado || "Local não informado"} • {formatDate(item.data_achado)}
                        </p>
                      </div>
                      <StatusBadge status={item.status_visual || item.status} />
                    </div>

                    <div className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                      <p><strong>Usuário:</strong> {item.solicitante_nome || "Não informado"}</p>
                      <p><strong>Email:</strong> {item.solicitante_email || "Não informado"}</p>
                      <p><strong>Matrícula:</strong> {item.solicitante_matricula || "Não informada"}</p>
                      <p><strong>CPF:</strong> {item.solicitante_cpf || "Não informado"}</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      <p className={expanded ? "" : "line-clamp-2"}>{description}</p>
                      {description.length > 120 ? (
                        <button type="button" className="mt-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400" onClick={() => setExpandedItems((current) => ({ ...current, [item.id]: !expanded }))}>
                          {expanded ? "Exibir menos" : "Exibir mais"}
                        </button>
                      ) : null}
                    </div>

                    <form className="space-y-3" onSubmit={(event) => handleSubmit(event, item)}>
                      <label className="space-y-1">
                        <span className="sigap-label">Código de coleta</span>
                        <div className="relative">
                          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <input className="sigap-input pl-10" value={form.codigo} onChange={(event) => updateForm(item.id, event.target.value)} placeholder="A1B2C3" disabled={isBusy} required />
                        </div>
                      </label>

                      <FigmaButton type="submit" className="w-full" loading={isBusy}>
                        <CheckCircle2 className="h-4 w-4" />
                        {isBusy ? "Validando..." : "Confirmar coleta"}
                      </FigmaButton>
                    </form>
                  </div>
                </FigmaCard>
              );
            })}
          </div>
        )}
      </section>

      {lightboxUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightboxUrl(null)} aria-label="Fechar imagem">
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxUrl} alt="Imagem ampliada do item" className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain" />
        </div>
      ) : null}
    </main>
  );
}
