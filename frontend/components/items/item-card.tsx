"use client";

import { useState } from "react";
import { CalendarDays, ImageIcon, Info, MapPin, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Item } from "@/lib/types";
import { formatDate, getItemImageUrl } from "@/lib/utils";

export function ItemCard({ item, onDetails }: { item: Item; onDetails: (item: Item) => void }) {
  const imageUrl = getItemImageUrl(item.imagem_url);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isDelivered = item.status === "entregue";

  return (
    <>
      <article className={`group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 ${isDelivered ? "opacity-70" : ""}`}>
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {imageUrl ? (
            <button type="button" onClick={() => setIsLightboxOpen(true)} className="block h-full w-full" aria-label="Ampliar imagem do item">
              <img
                src={imageUrl}
                alt={item.nome_item}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_48%,#dcfce7_100%)] text-slate-500 dark:bg-[linear-gradient(135deg,#172554_0%,#0f172a_50%,#052e16_100%)] dark:text-slate-300">
              <ImageIcon size={44} />
              <span className="text-sm">Sem imagem</span>
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={item.status} />
          </div>
          {isDelivered ? (
            <div className="absolute inset-x-0 bottom-0 bg-blue-700/90 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-white">
              Devolvido
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 text-lg font-bold text-slate-950 dark:text-white">{item.nome_item}</h3>
              <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {item.categoria || "Sem categoria"}
              </p>
            </div>
          </div>

          {item.descricao ? (
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.descricao}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Descricao nao informada.</p>
          )}

          <div className="mt-4 grid gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} />
              {item.local_encontrado || "Local nao informado"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} />
              {formatDate(item.data_achado)}
            </span>
          </div>

          <button type="button" onClick={() => onDetails(item)} className="sigap-secondary mt-5 w-full">
            <Info size={17} />
            Ver detalhes
          </button>
        </div>
      </article>

      {isLightboxOpen && imageUrl ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/88 p-4">
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Fechar imagem ampliada"
          >
            <X size={20} />
          </button>
          <img src={imageUrl} alt={item.nome_item} className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
        </div>
      ) : null}
    </>
  );
}
