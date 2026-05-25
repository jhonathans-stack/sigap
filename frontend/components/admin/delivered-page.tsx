"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Filter, Package, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { FigmaButton, FigmaCard } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, itensApi } from "@/lib/api";
import type { DeliveryReport } from "@/lib/types";
import { formatDate, formatDateTime, getItemImageUrls } from "@/lib/utils";

const categories = ["Documentos", "Eletronicos", "Material escolar", "Vestuario", "Acessorios", "Outros"];

export function DeliveredPage() {
  const [reports, setReports] = useState<DeliveryReport[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [local, setLocal] = useState("");
  const [loading, setLoading] = useState(true);

  const filters = useMemo(() => ({ busca: search, categoria: category, local }), [category, local, search]);

  const fetchReports = useCallback(async () => {
    setLoading(true);

    try {
      const data = await itensApi.deliveredReports(filters);
      setReports(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar itens entregues."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchReports();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchReports]);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setLocal("");
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Itens entregues</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulte relatórios de coleta por item, responsável, pessoa que retirou, documento, local e categoria.
          </p>
        </div>

        <FigmaCard className="mb-8 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input className="sigap-input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por item, pessoa, documento ou responsável..." />
            </label>

            <select className="sigap-input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Todas as categorias</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <input className="sigap-input" value={local} onChange={(event) => setLocal(event.target.value)} placeholder="Filtrar por local" />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <FigmaButton type="button" variant="secondary" onClick={clearFilters}>Limpar</FigmaButton>
            <FigmaButton type="button" variant="secondary" onClick={fetchReports} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </FigmaButton>
          </div>
        </FigmaCard>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : reports.length === 0 ? (
          <FigmaCard className="p-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Nenhum item entregue encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400">Ajuste os filtros ou aguarde novas coletas.</p>
          </FigmaCard>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const imageUrl = getItemImageUrls(report.imagens_urls, report.imagem_url)[0];

              return (
                <FigmaCard key={report.id} className="p-5">
                  <div className="grid gap-5 lg:grid-cols-[160px_1fr]">
                    <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      {imageUrl ? <img src={imageUrl} alt={report.nome_item || "Item entregue"} className="h-full w-full object-cover" /> : <Package className="h-12 w-12 text-gray-400" />}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{report.nome_item || "Item sem nome"}</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.categoria || "Sem categoria"} • {report.local_encontrado || "Local não informado"} • {formatDate(report.data_achado)}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-400/15 dark:text-blue-200">
                          {formatDateTime(report.criado_em)}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Info label="Retirado por" value={report.coletor_nome} />
                        <Info label="Documento" value={report.coletor_documento} />
                        <Info label="Entregue por" value={report.entregue_por_nome || "Não informado"} />
                        <Info label="Solicitante" value={report.solicitante_nome || "Não informado"} />
                        <Info label="Email do solicitante" value={report.solicitante_email || "Não informado"} />
                        <Info label="Matrícula" value={report.solicitante_matricula || "Não informada"} />
                      </div>

                      {report.descricao ? <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">{report.descricao}</p> : null}
                    </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
