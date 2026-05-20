export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-96 animate-pulse overflow-hidden rounded-lg border border-slate-200 bg-white/80 shadow-soft dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800" />
          <div className="m-4 h-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="px-4">
          <div className="mt-5 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 h-9 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
