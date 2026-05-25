"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { FigmaButton, FigmaCard } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { Item } from "@/lib/types";
import { formatDate, getItemImageUrls } from "@/lib/utils";

type CollectionForm = {
  codigo: string;
  coletor_nome: string;
  coletor_documento: string;
};

const emptyForm: CollectionForm = {
  codigo: "",
  coletor_nome: "",
  coletor_documento: ""
};

export function CollectionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [forms, setForms] = useState<Record<number, CollectionForm>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);

    try {
      const data = await itensApi.listForCollection();
      setItems(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar itens para coleta."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  function updateForm(itemId: number, field: keyof CollectionForm, value: string) {
    setForms((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || emptyForm),
        [field]: field === "codigo" ? value.replace(/\D/g, "").slice(0, 6) : value
      }
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, item: Item) {
    event.preventDefault();

    const form = forms[item.id] || emptyForm;

    if (!/^\d{6}$/.test(form.codigo)) {
      toast.error("Informe o código de coleta com 6 dígitos.");
      return;
    }

    if (form.coletor_nome.trim().length < 3 || form.coletor_documento.trim().length < 3) {
      toast.error("Informe nome e documento de quem está retirando o item.");
      return;
    }

    setBusyId(item.id);

    try {
      await itensApi.confirmCollection(item.id, {
        codigo: form.codigo,
        coletor_nome: form.coletor_nome.trim(),
        coletor_documento: form.coletor_documento.trim()
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
              const imageUrl = getItemImageUrls(item.imagens_urls, item.imagem_url)[0];
              const form = forms[item.id] || emptyForm;
              const isBusy = busyId === item.id;

              return (
                <FigmaCard key={item.id} className="overflow-hidden">
                  {imageUrl ? <img src={imageUrl} alt={item.nome_item} className="h-56 w-full object-cover" /> : null}
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{item.nome_item}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.local_encontrado || "Local não informado"} • {formatDate(item.data_achado)}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <form className="space-y-3" onSubmit={(event) => handleSubmit(event, item)}>
                      <label className="space-y-1">
                        <span className="sigap-label">Código de coleta</span>
                        <div className="relative">
                          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <input className="sigap-input pl-10" value={form.codigo} onChange={(event) => updateForm(item.id, "codigo", event.target.value)} placeholder="000000" inputMode="numeric" disabled={isBusy} required />
                        </div>
                      </label>

                      <label className="space-y-1">
                        <span className="sigap-label">Nome de quem retirou</span>
                        <input className="sigap-input" value={form.coletor_nome} onChange={(event) => updateForm(item.id, "coletor_nome", event.target.value)} disabled={isBusy} required />
                      </label>

                      <label className="space-y-1">
                        <span className="sigap-label">Documento de quem retirou</span>
                        <input className="sigap-input" value={form.coletor_documento} onChange={(event) => updateForm(item.id, "coletor_documento", event.target.value)} disabled={isBusy} required />
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
    </main>
  );
}
