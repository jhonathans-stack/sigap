"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}
