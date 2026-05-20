import type { ItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ItemStatus }) {
  const label =
    status === "achado" ? "Aguardando coleta" : status === "aguardando_retirada" ? "Aguardando retirada" : "Devolvido";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "achado"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
          : status === "aguardando_retirada"
            ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200"
      )}
    >
      {label}
    </span>
  );
}
