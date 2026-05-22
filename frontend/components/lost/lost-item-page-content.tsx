"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { LostItemForm } from "@/components/lost/lost-item-form";
import { FigmaButton } from "@/components/ui/figma-primitives";

export function LostItemPageContent() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <FigmaButton type="button" variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </FigmaButton>
          </Link>

          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Perdi um item</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cadastre um alerta para ser notificado quando um item parecido for encontrado
          </p>
        </div>

        <LostItemForm />
      </section>
    </main>
  );
}
