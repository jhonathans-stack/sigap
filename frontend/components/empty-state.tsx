import Link from "next/link";
import { PlusCircle, SearchX } from "lucide-react";

export function EmptyState({ message = "Nenhum item encontrado", canCreate = false }: { message?: string; canCreate?: boolean }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-white/80 p-8 text-center shadow-soft dark:border-blue-900/60 dark:bg-slate-900/70">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
        <SearchX size={36} />
      </div>
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{message}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {canCreate
          ? "Ajuste a busca ou cadastre um novo item para que ele apareça por aqui."
          : "Ajuste a busca para encontrar outros registros."}
      </p>
      {canCreate ? (
        <Link href="/items/new" className="sigap-primary mt-5">
          <PlusCircle size={17} />
          Cadastrar item
        </Link>
      ) : null}
    </div>
  );
}
