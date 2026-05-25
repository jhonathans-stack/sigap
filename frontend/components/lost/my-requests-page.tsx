"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, ExternalLink, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { ItemDetailsModal } from "@/components/items/item-details-modal";
import { FigmaButton, FigmaCard } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, itensApi, lostItemsApi } from "@/lib/api";
import type { Item, LostItemRequest } from "@/lib/types";
import { formatDate, getItemImageUrl } from "@/lib/utils";

function requestStatusLabel(status: LostItemRequest["status"]) {
  if (status === "encontrado") {
    return "Possivel match encontrado";
  }

  if (status === "cancelado") {
    return "Cancelado";
  }

  return "Alerta ativo";
}

function requestStatusColor(status: LostItemRequest["status"]) {
  if (status === "encontrado") {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
  }

  if (status === "cancelado") {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }

  return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
}

function itemStatusLabel(status: Item["status"]) {
  if (status === "perdido") {
    return "Perdido";
  }

  if (status === "aguardando_coleta") {
    return "Aguardando coleta";
  }

  if (status === "devolvido") {
    return "Devolvido";
  }

  return "Achado";
}

function itemStatusColor(status: Item["status"]) {
  if (status === "aguardando_coleta") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  }

  if (status === "devolvido") {
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
  }

  if (status === "perdido") {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }

  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
}

function turnoLabel(turno: LostItemRequest["turno"]) {
  if (turno === "manha") {
    return "Manha";
  }

  if (turno === "tarde") {
    return "Tarde";
  }

  return "Noite";
}

export function MyRequestsPage() {
  const [requests, setRequests] = useState<LostItemRequest[]>([]);
  const [claimedItems, setClaimedItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  const totals = useMemo(
    () => ({
      total: requests.length + claimedItems.length,
      ativos: requests.filter((request) => request.status === "alerta_ativo").length + claimedItems.filter((item) => item.status === "achado" || item.status === "perdido").length,
      andamento:
        requests.filter((request) => request.status === "encontrado").length +
        claimedItems.filter((item) => item.status === "aguardando_coleta").length
    }),
    [claimedItems, requests]
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);

    try {
      const [lostData, claimedData] = await Promise.all([lostItemsApi.mine(), itensApi.myRequests()]);
      setRequests(lostData);
      setClaimedItems(claimedData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar solicitacoes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  function handleUpdated(updatedItem: Item) {
    setClaimedItems((currentItems) => currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    setSelectedItem(updatedItem);
  }

  async function handleMarkFound(request: LostItemRequest) {
    if (!window.confirm(`Tem certeza que deseja marcar "${request.nome_item}" como encontrado?`)) {
      return;
    }

    try {
      const response = await lostItemsApi.markFound(request.id);
      setRequests((current) => current.map((item) => (item.id === request.id ? response.solicitacao : item)));
      setClaimedItems((current) =>
        current.map((item) => (item.id === request.item_id ? { ...item, status: "devolvido" } : item))
      );
      toast.success("Solicitação atualizada com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível atualizar a solicitação."));
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Acompanhamento pessoal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe seus alertas de itens perdidos e solicitacoes de devolucao
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Total" value={totals.total} icon={Package} color="text-blue-500" />
          <StatCard label="Ativos" value={totals.ativos} icon={Clock} color="text-green-500" />
          <StatCard label="Em andamento" value={totals.andamento} icon={CheckCircle} color="text-amber-500" />
        </div>

        <div className="mb-6">
          <Link href="/lost/new">
            <FigmaButton type="button">
              <Plus className="h-4 w-4" />
              Novo alerta
            </FigmaButton>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : requests.length === 0 && claimedItems.length === 0 ? (
          <FigmaCard className="p-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Nenhuma solicitacao</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Voce ainda nao possui alertas ou solicitacoes de devolucao
            </p>
            <Link href="/lost/new">
              <FigmaButton type="button">Criar primeiro alerta</FigmaButton>
            </Link>
          </FigmaCard>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {claimedItems.map((item) => (
              <ClaimedItemCard key={`item-${item.id}`} item={item} onDetails={setSelectedItem} />
            ))}

            {requests.map((request) => (
              <LostRequestCard key={`alerta-${request.id}`} request={request} onMarkFound={handleMarkFound} />
            ))}
          </div>
        )}
      </section>

      <ItemDetailsModal
        item={selectedItem}
        canManage={false}
        onClose={() => setSelectedItem(null)}
        onUpdated={handleUpdated}
        onDeleted={() => undefined}
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

function ClaimedItemCard({ item, onDetails }: { item: Item; onDetails: (item: Item) => void }) {
  const imageUrl = getItemImageUrl(item.imagem_url);

  return (
    <FigmaCard className="overflow-hidden">
      {imageUrl ? (
        <div className="h-48 bg-gray-200 dark:bg-gray-700">
          <img src={imageUrl} alt={item.nome_item} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">{item.nome_item}</h3>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">Item</span>
        </div>

        <div className="mb-4 space-y-2">
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${itemStatusColor(item.status)}`}>
            {itemStatusLabel(item.status)}
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.categoria || "Sem categoria"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Local: {item.local_encontrado || "Nao informado"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Data: {formatDate(item.data_achado)}</p>
        </div>

        {item.status !== "devolvido" ? (
          <FigmaButton type="button" variant="ghost" className="w-full" onClick={() => onDetails(item)}>
            Ver detalhes
          </FigmaButton>
        ) : null}
      </div>
    </FigmaCard>
  );
}

function LostRequestCard({ request, onMarkFound }: { request: LostItemRequest; onMarkFound: (request: LostItemRequest) => void }) {
  const imageUrl = getItemImageUrl(request.imagem_url);

  return (
    <FigmaCard className="overflow-hidden">
      {imageUrl ? (
        <div className="h-48 bg-gray-200 dark:bg-gray-700">
          <img src={imageUrl} alt={request.nome_item} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">{request.nome_item}</h3>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">Alerta</span>
        </div>

        <div className="mb-4 space-y-2">
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${requestStatusColor(request.status)}`}>
            {requestStatusLabel(request.status)}
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-400">{request.categoria}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Local: {request.local_provavel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Data: {formatDate(request.data_perda)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Turno: {turnoLabel(request.turno)}</p>
        </div>

        {request.status === "encontrado" ? (
          <Link href="/">
            <FigmaButton type="button" variant="ghost" className="w-full">
              <ExternalLink className="h-4 w-4" />
              Ver vitrine
            </FigmaButton>
          </Link>
        ) : null}

        {request.status === "alerta_ativo" ? (
          <FigmaButton type="button" variant="secondary" className="mt-3 w-full" onClick={() => onMarkFound(request)}>
            <CheckCircle className="h-4 w-4" />
            Já encontrei esse item
          </FigmaButton>
        ) : null}
      </div>
    </FigmaCard>
  );
}
