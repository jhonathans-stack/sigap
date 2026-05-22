"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Filter, Package, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { StatusBadge } from "@/components/status-badge";
import { FigmaButton, FigmaCard } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { Item, ItemStatus } from "@/lib/types";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageItems } from "@/lib/storage";
import { formatDate, getItemImageUrl } from "@/lib/utils";

const categories = [
  { value: "documentos", label: "Documentos" },
  { value: "eletronicos", label: "Eletronicos" },
  { value: "material escolar", label: "Material escolar" },
  { value: "vestuario", label: "Vestuario" },
  { value: "acessorios", label: "Acessorios" },
  { value: "outros", label: "Outros" }
];

const locations = [
  "Patio central",
  "Biblioteca",
  "Laboratorios do Monte Castelo",
  "Cantina",
  "Secretaria academica",
  "Auditorio principal"
];

const statusOptions = [
  { value: "achado", label: "Achado" },
  { value: "aguardando_retirada", label: "Aguardando retirada" },
  { value: "entregue", label: "Entregue" }
];

const itemsPerPage = 6;

function formatCategory(category?: string | null) {
  const normalized = String(category || "").toLowerCase();
  return categories.find((item) => item.value === normalized)?.label || category || "Sem categoria";
}

export function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | "">("");
  const [sortOrder, setSortOrder] = useState<"recentes" | "antigos">("recentes");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const canManage = canManageItems(user);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const filters = useMemo(
    () => ({
      nome: debouncedSearch,
      categoria: selectedCategory,
      local: selectedLocation,
      status: selectedStatus,
      ordem: sortOrder
    }),
    [debouncedSearch, selectedCategory, selectedLocation, selectedStatus, sortOrder]
  );

  const stats = useMemo(
    () => ({
      total: items.length,
      achados: items.filter((item) => item.status === "achado").length,
      entregues: items.filter((item) => item.status === "entregue").length
    }),
    [items]
  );

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = useMemo(
    () => items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage),
    [currentPage, items]
  );

  const fetchItems = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await itensApi.list(filters);
        setItems(data);
        setCurrentPage(0);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Erro ao carregar itens."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void fetchItems(false);
  }, [fetchItems]);

  function clearFilters() {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("");
    setSelectedLocation("");
    setSelectedStatus("");
    setSortOrder("recentes");
    setCurrentPage(0);
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Itens cadastrados</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {canManage
              ? "Consulte, filtre e acompanhe os registros do sistema de achados e perdidos"
              : "Consulte os itens encontrados, veja detalhes, local, data do achado e situacao de devolucao"}
          </p>

          {!canManage ? (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Modo consulta:</strong> seu perfil pode visualizar os itens, mas nao pode cadastrar, editar ou excluir registros.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Total" value={stats.total} icon={Package} color="text-blue-500" />
          <StatCard label="Achados" value={stats.achados} icon={Clock} color="text-green-500" />
          <StatCard label="Entregues" value={stats.entregues} icon={CheckCircle} color="text-gray-500" />
        </div>

        <FigmaCard className="mb-8 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Buscar item..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Todos os locais</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as ItemStatus | "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Todos os status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as "recentes" | "antigos")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </select>

            <FigmaButton type="button" variant="secondary" onClick={clearFilters}>
              Limpar
            </FigmaButton>

            <FigmaButton type="button" variant="secondary" onClick={() => fetchItems(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </FigmaButton>
          </div>
        </FigmaCard>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <FigmaCard className="p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Nenhum item encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou limpar a busca</p>
          </FigmaCard>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item) => (
                <ItemGridCard key={item.id} item={item} onDetails={setSelectedItem} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-4">
                <FigmaButton
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                  Anterior
                </FigmaButton>

                <span className="text-gray-700 dark:text-gray-300">
                  Pagina {currentPage + 1} de {totalPages}
                </span>

                <FigmaButton
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Proximo
                  <ChevronRight className="h-5 w-5" />
                </FigmaButton>
              </div>
            ) : null}
          </>
        )}
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Package; color: string }) {
  return (
    <FigmaCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <Icon className={`h-12 w-12 ${color}`} />
      </div>
    </FigmaCard>
  );
}

function ItemGridCard({ item, onDetails }: { item: Item; onDetails: (item: Item) => void }) {
  const imageUrl = getItemImageUrl(item.imagem_url);
  const isDelivered = item.status === "entregue";

  return (
    <FigmaCard className={`overflow-hidden ${isDelivered ? "opacity-60" : ""}`} onClick={() => onDetails(item)}>
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
        {imageUrl ? (
          <img src={imageUrl} alt={item.nome_item} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {isDelivered ? (
          <div className="absolute right-2 top-2 rounded-full bg-gray-800/90 px-3 py-1 text-sm font-medium text-white">
            Devolvido
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">{item.nome_item}</h3>

        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <StatusBadge status={item.status} />
            <span>{formatCategory(item.categoria)}</span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">Local: {item.local_encontrado || "Nao informado"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Data: {formatDate(item.data_achado)}</p>
        </div>

        <FigmaButton type="button" variant="ghost" className="w-full">
          Ver detalhes
        </FigmaButton>
      </div>
    </FigmaCard>
  );
}
