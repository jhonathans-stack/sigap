"use client";

import { useTheme } from "@/components/providers/theme-provider";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-clara.png";
  const sizeClass = compact ? "h-12 w-32 sm:h-14 sm:w-36" : "h-32 w-80 sm:h-40 sm:w-96";

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${sizeClass}`}>
      <img src={src} alt="Logo do sistema" className="h-full w-full object-contain object-center" />
    </span>
  );
}
