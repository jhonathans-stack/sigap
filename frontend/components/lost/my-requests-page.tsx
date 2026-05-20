"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileSearch, MapPin, PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
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

function requestStatusClass(status: LostItemRequest["status"]) {
  if (status === "encontrado") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200";
  }

  if (status === "cancelado") {
    return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }

  return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totals = useMemo(
    () => ({
      all: requests.length,
      active: requests.filter((request) => request.status === "alerta_ativo").length,
      found: requests.filter((request) => request.status === "encontrado").length + claimedItems.length
    }),
    [claimedItems.length, requests]
  );

  const loadRequests = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [lostData, claimedData] = await Promise.all([lostItemsApi.mine(), itensApi.myRequests()]);
      setRequests(lostData);
      setClaimedItems(claimedData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel carregar suas solicitacoes."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="sigap-section-band overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Minhas solicitacoes
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Acompanhamento pessoal</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Acompanhe alertas de objetos perdidos e veja quando o sistema encontrar algum item parecido.
              </p>
              <Link href="/lost/new" className="sigap-primary mt-5">
                <PlusCircle size={18} />
                Novo alerta
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Summary label="Total" value={totals.all} />
              <Summary label="Ativos" value={totals.active} />
              <Summary label="Em andamento" value={totals.found} />
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" className="sigap-secondary" onClick={() => loadRequests(true)} disabled={isRefreshing}>
            <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <section className="mt-6 grid gap-4">
          {claimedItems.length ? (
            <div className="sigap-surface rounded-lg p-5">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Itens reivindicados da vitrine</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Acompanhe solicitações abertas em itens que voce pediu para retirar.
              </p>
              <div className="mt-4 grid gap-3">
                {claimedItems.map((item) => {
                  const imageUrl = getItemImageUrl(item.imagem_url);

                  return (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                      <div className="grid gap-3 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                        <div className="overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.nome_item} className="aspect-[4/3] w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center text-xs text-slate-500">Sem imagem</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-950 dark:text-white">{item.nome_item}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {item.local_encontrado || "Local nao informado"} - {formatDate(item.data_achado)}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="sigap-surface rounded-lg p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Carregando solicitacoes...
            </div>
          ) : requests.length ? (
            requests.map((request) => {
              const imageUrl = getItemImageUrl(request.imagem_url);

              return (
                <article key={request.id} className="sigap-surface overflow-hidden rounded-lg">
                  <div className="grid gap-4 p-4 md:grid-cols-[170px_1fr_auto] md:items-center">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                      {imageUrl ? (
                        <img src={imageUrl} alt={request.nome_item} className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-500">
                          Sem imagem
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-950 dark:text-white">{request.nome_item}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${requestStatusClass(request.status)}`}>
                          {requestStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{request.caracteristicas}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={15} />
                          {formatDate(request.data_perda)} - {turnoLabel(request.turno)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={15} />
                          {request.local_provavel}
                        </span>
                        <span>{request.categoria}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {request.status === "encontrado" ? (
                        <Link href="/" className="sigap-primary">
                          <FileSearch size={17} />
                          Ver vitrine
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : claimedItems.length ? null : (
            <div className="sigap-surface rounded-lg p-8 text-center">
              <FileSearch className="mx-auto text-blue-700 dark:text-blue-300" size={42} />
              <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Nenhuma solicitacao cadastrada</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Quando voce reportar um item perdido, ele aparecera aqui.
              </p>
              <Link href="/lost/new" className="sigap-primary mt-5">
                <PlusCircle size={18} />
                Cadastrar alerta
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
      <span className="text-sm font-semibold">{label}</span>
      <strong className="mt-2 block text-3xl font-black">{value}</strong>
    </div>
  );
}
