"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { FigmaButton, FigmaCard, FigmaModal } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, p2pApi } from "@/lib/api";
import type { P2PReport } from "@/lib/types";
import { formatDateTime, getItemImageUrl } from "@/lib/utils";

export function P2PReportPage() {
  const [reports, setReports] = useState<P2PReport[]>([]);
  const [selected, setSelected] = useState<P2PReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const data = await p2pApi.reports();
      setReports(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar relatórios P2P."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Relatórios P2P</h1>
            <p className="text-gray-600 dark:text-gray-400">Histórico completo de conversas P2P. Visível somente para superusuários.</p>
          </div>
          <FigmaButton type="button" variant="secondary" onClick={loadReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </FigmaButton>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : reports.length ? (
          <div className="space-y-4">
            {reports.map((report) => {
              const imageUrl = getItemImageUrl(report.imagem_url || report.item?.imagem_url);
              const messages = Array.isArray(report.mensagens) ? report.mensagens : [];

              return (
                <FigmaCard key={report.id} className="p-5">
                  <div className="grid gap-5 md:grid-cols-[120px_1fr_auto] md:items-center">
                    <div className="h-28 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      {imageUrl ? <img src={imageUrl} alt={report.nome_item || report.item?.nome_item || "Item"} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{report.nome_item || report.item?.nome_item || "Item P2P"}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dono: {report.dono_nome || "Não informado"} • Encontrado por: {report.encontrador_nome || "Não informado"}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status: {report.status} • Mensagens: {messages.length}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Atualizado em {formatDateTime(report.atualizado_em)}</p>
                    </div>
                    <FigmaButton type="button" variant="secondary" onClick={() => setSelected(report)}>
                      <Eye className="h-4 w-4" />
                      Ver histórico
                    </FigmaButton>
                  </div>
                </FigmaCard>
              );
            })}
          </div>
        ) : (
          <FigmaCard className="p-12 text-center">
            <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nenhum relatório P2P encontrado</h3>
          </FigmaCard>
        )}
      </section>

      <FigmaModal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Histórico P2P" size="lg">
        {selected ? (
          <div className="space-y-4">
            {(selected.mensagens || []).map((message) => (
              <div key={message.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">{message.usuario_nome || "Usuário"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(message.criado_em)}</p>
                </div>
                {message.texto ? <p className="text-sm text-gray-700 dark:text-gray-300">{message.texto}</p> : null}
                {message.imagem_url ? <img src={getItemImageUrl(message.imagem_url) || ""} alt="Imagem do histórico" className="mt-3 max-h-80 rounded-xl object-contain" /> : null}
              </div>
            ))}
          </div>
        ) : null}
      </FigmaModal>
    </main>
  );
}
