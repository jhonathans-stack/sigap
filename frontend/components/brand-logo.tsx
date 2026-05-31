"use client";

import { useTheme } from "@/components/providers/theme-provider";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-clara.png";

  return (
    <span className="inline-flex items-center gap-3">
      <span className={compact ? "h-10 w-10 overflow-hidden rounded-xl" : "h-12 w-12 overflow-hidden rounded-2xl"}>
        <img src={src} alt="DropZone" className="h-full w-full object-cover object-center" />
      </span>
      <span className={compact ? "text-xl font-bold" : "text-3xl font-bold"}>DropZone</span>
    </span>
  );
}
