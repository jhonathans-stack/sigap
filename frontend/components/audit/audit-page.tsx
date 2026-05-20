"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { useAuth } from "@/components/providers/auth-provider";
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

export function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const totals = useMemo(
    () => ({
      all: logs.length,
      items: logs.filter((log) => log.entidade === "itens").length,
      users: logs.filter((log) => log.entidade === "usuarios").length
    }),
    [logs]
  );

  const loadLogs = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await auditApi.list();
      setLogs(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel carregar auditoria."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  async function handleExport() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const blob = await auditApi.exportItemsCsv();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sigap-itens-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Relatorio CSV gerado.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Nao foi possivel exportar o relatorio."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="sigap-section-band overflow-hidden rounded-lg">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Auditoria
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Logs imutaveis do sistema</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Consulte alteracoes de itens, usuarios e alertas. Os registros sao apenas leitura.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Summary label="Eventos" value={totals.all} />
              <Summary label="Itens" value={totals.items} />
              <Summary label="Usuarios" value={totals.users} />
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {user?.role === "super" ? (
            <button type="button" className="sigap-primary" onClick={handleExport} disabled={isExporting}>
              <Download size={17} />
              {isExporting ? "Exportando..." : "Exportar itens CSV"}
            </button>
          ) : null}
          <button type="button" className="sigap-secondary" onClick={() => loadLogs(true)} disabled={isRefreshing}>
            <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-soft dark:border-slate-800 dark:bg-slate-950/80">
          {isLoading ? (
            <div className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando auditoria...</div>
          ) : logs.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Acao</th>
                    <th className="px-4 py-3">Entidade</th>
                    <th className="px-4 py-3">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(log.criado_em)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-950 dark:text-white">{log.usuario_nome || "Sistema"}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{log.usuario_email || "Sem email"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-700 dark:text-blue-300">{log.acao}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {log.entidade}
                        {log.entidade_id ? ` #${log.entidade_id}` : ""}
                      </td>
                      <td className="max-w-xl px-4 py-3 text-slate-600 dark:text-slate-300">{formatDetails(log.detalhes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <ShieldCheck className="mx-auto text-blue-700 dark:text-blue-300" size={42} />
              <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Nenhum log encontrado</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                As proximas acoes administrativas aparecerao aqui.
              </p>
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
