"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Eye, FileText, Package, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { useAuth } from "@/components/providers/auth-provider";
import { FigmaButton, FigmaCard, FigmaModal } from "@/components/ui/figma-primitives";
import { auditApi, getApiErrorMessage } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function formatDetails(details?: Record<string, unknown>) {
  if (!details || !Object.keys(details).length) {
    return "Sem detalhes";
  }

  return Object.entries(details)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

function humanizeAction(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatPromotion(details?: Record<string, unknown>) {
  if (!details) {
    return "Promoção registrada.";
  }

  const operator = details.operador_nome || details.operador_email || "Operador não informado";
  const target = details.promovido_nome || details.promovido_email || details.email || "Usuário promovido";
  return `${String(operator)} promoveu ${String(target)} para superusuário.`;
}

function getActionColor(acao: string) {
  const value = acao.toLowerCase();

  if (value.includes("criado") || value.includes("criar")) {
    return "text-green-600 dark:text-green-400";
  }

  if (value.includes("atualizado") || value.includes("editar")) {
    return "text-blue-600 dark:text-blue-400";
  }

  if (value.includes("excluido") || value.includes("excluir")) {
    return "text-red-600 dark:text-red-400";
  }

  if (value.includes("solicit")) {
    return "text-purple-600 dark:text-purple-400";
  }

  if (value.includes("confirm")) {
    return "text-amber-600 dark:text-amber-400";
  }

  if (value.includes("promov")) {
    return "text-indigo-600 dark:text-indigo-400";
  }

  return "text-gray-600 dark:text-gray-400";
}

export function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const logsPerPage = 10;

  const stats = useMemo(
    () => ({
      eventos: logs.length,
      itens: logs.filter((log) => log.entidade === "itens").length,
      usuarios: logs.filter((log) => log.entidade === "usuarios").length
    }),
    [logs]
  );
  const totalPages = Math.ceil(logs.length / logsPerPage);
  const visibleLogs = logs.slice(currentPage * logsPerPage, (currentPage + 1) * logsPerPage);

  const fetchLogs = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await auditApi.list();
      setLogs(data);
      setCurrentPage(0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar logs de auditoria."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  async function handleExport() {
    if (exporting) {
      return;
    }

    setExporting(true);

    try {
      const blob = await auditApi.exportItemsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `itens_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exportacao realizada com sucesso.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao exportar dados."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Logs imutáveis do sistema</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulte alterações de itens, usuários e alertas. Os registros são apenas leitura.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Eventos" value={stats.eventos} icon={FileText} color="text-blue-500" />
          <StatCard label="Itens" value={stats.itens} icon={Package} color="text-green-500" />
          <StatCard label="Usuarios" value={stats.usuarios} icon={Users} color="text-purple-500" />
        </div>

        <div className="mb-6 flex gap-3">
          <FigmaButton type="button" variant="secondary" onClick={() => fetchLogs(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </FigmaButton>

          {user?.role === "super" ? (
            <FigmaButton type="button" onClick={handleExport} loading={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Exportar itens CSV"}
            </FigmaButton>
          ) : null}
        </div>

        <FigmaCard className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Acao</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Entidade</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(log.criado_em)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{log.usuario_nome || "Sistema"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.usuario_email || "Sem email"}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${getActionColor(log.acao)}`}>{humanizeAction(log.acao)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.entidade}
                        {log.entidade_id ? ` #${log.entidade_id}` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {log.entidade === "itens" ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver item
                          </button>
                        ) : log.acao.includes("promovido") ? (
                          formatPromotion(log.detalhes)
                        ) : (
                          formatDetails(log.detalhes)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhum log de auditoria encontrado</p>
                </div>
              ) : null}

              {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-4 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
                  <FigmaButton type="button" variant="secondary" onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} disabled={currentPage === 0}>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </FigmaButton>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <FigmaButton type="button" variant="secondary" onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))} disabled={currentPage === totalPages - 1}>
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </FigmaButton>
                </div>
              ) : null}
            </div>
          )}
        </FigmaCard>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Nota:</strong> Os logs de auditoria sao registros imutaveis de todas as operacoes realizadas no
            sistema. Eles nao podem ser editados ou excluidos e servem para rastreabilidade e conformidade.
          </p>
        </div>
      </section>

      <FigmaModal isOpen={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} title="Informações do item" size="lg">
        {selectedLog ? (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <InfoLine label="Ação" value={humanizeAction(selectedLog.acao)} />
            <InfoLine label="Data" value={formatDateTime(selectedLog.criado_em)} />
            <InfoLine label="Operador" value={selectedLog.usuario_nome || selectedLog.usuario_email || "Sistema"} />
            <InfoLine label="Item" value={String(selectedLog.detalhes?.nome_item || `Registro #${selectedLog.entidade_id || "-"}`)} />
            {selectedLog.detalhes
              ? Object.entries(selectedLog.detalhes).map(([key, value]) => (
                  <InfoLine key={key} label={humanizeAction(key)} value={String(value)} />
                ))
              : null}
          </div>
        ) : null}
      </FigmaModal>
    </main>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof FileText; color: string }) {
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
