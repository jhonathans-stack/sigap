"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheckBig, FilterX, PackageCheck, PackageOpen, PlusCircle, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Header } from "@/components/header";
import { ItemCarousel } from "@/components/items/item-carousel";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { Item, ItemStatus } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageItems } from "@/lib/storage";

const categoryOptions = ["documentos", "eletrônicos", "material escolar", "roupas", "acessórios", "outros"];

export function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState<ItemStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const canManage = canManageItems(user);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const filters = useMemo(
    () => ({
      nome: debouncedSearch,
      categoria,
      status
    }),
    [debouncedSearch, categoria, status]
  );

  const summary = useMemo(
    () => [
      {
        label: "Total",
        value: items.length,
        icon: PackageOpen,
        tone: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200"
      },
      {
        label: "Achados",
        value: items.filter((item) => item.status === "achado").length,
        icon: PackageCheck,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
      },
      {
        label: "Entregues",
        value: items.filter((item) => item.status === "entregue").length,
        icon: CircleCheckBig,
        tone: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      }
    ],
    [items]
  );

  const loadItems = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await itensApi.list(filters);
        setItems(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Nao foi possivel carregar os itens."));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void loadItems(false);
  }, [loadItems]);

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategoria("");
    setStatus("");
  }

  function handleUpdated(updatedItem: Item) {
    setItems((currentItems) => currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    setSelectedItem(updatedItem);
  }

  function handleDeleted(id: number) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    setSelectedItem(null);
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="sigap-section-band overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_360px] lg:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">SIGAP</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">Itens cadastrados</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {canManage
                  ? "Consulte, filtre, atualize e acompanhe os registros do sistema de achados e perdidos."
                  : "Consulte os itens encontrados, veja detalhes, local, data do achado e situação de devolução."}
              </p>
              {!canManage ? (
                <div className="mt-5 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200">
                  Modo consulta: seu perfil pode visualizar os itens, mas não pode cadastrar, editar ou excluir registros.
                </div>
              ) : null}
              {canManage ? (
                <Link href="/items/new" className="sigap-primary mt-5">
                  <PlusCircle size={18} />
                  Cadastrar item
                </Link>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {summary.map((item) => (
                <div key={item.label} className={`rounded-lg border p-4 ${item.tone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <item.icon size={20} />
                  </div>
                  <strong className="mt-2 block text-3xl font-black">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>

        <section className="sigap-surface mt-6 rounded-lg p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar por nome</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="sigap-input pl-10"
                placeholder="Buscar por nome"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label>
              <span className="sr-only">Categoria</span>
              <select className="sigap-input" value={categoria} onChange={(event) => setCategoria(event.target.value)}>
                <option value="">Todas as categorias</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Status</span>
              <select
                className="sigap-input"
                value={status}
                onChange={(event) => setStatus(event.target.value as ItemStatus | "")}
              >
                <option value="">Todos os status</option>
                <option value="achado">Aguardando coleta</option>
                <option value="entregue">Devolvido</option>
              </select>
            </label>

            <button type="button" className="sigap-secondary" onClick={clearFilters}>
              <FilterX size={17} />
              Limpar
            </button>

            <button type="button" className="sigap-secondary" onClick={() => loadItems(true)} disabled={isRefreshing}>
              <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </section>

        <section className="mt-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : items.length ? (
            <ItemCarousel items={items} onDetails={setSelectedItem} />
          ) : (
            <EmptyState canCreate={canManage} />
          )}
        </section>
      </section>

      <ItemDetailsModal
        item={selectedItem}
        canManage={canManage}
        onClose={() => setSelectedItem(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </main>
  );
}
