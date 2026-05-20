"use client";

import { Header } from "@/components/header";
import { LostItemForm } from "@/components/lost/lost-item-form";

export function LostItemPageContent() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="sigap-section-band mb-6 overflow-hidden rounded-lg">
          <div className="p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
              Perdi um item
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Cadastrar alerta de perda</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Informe os dados principais do objeto perdido. O SIGAP compara seu alerta com os itens encontrados antes de salvar.
            </p>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-blue-700 via-emerald-500 to-amber-400" />
        </div>
        <LostItemForm />
      </section>
    </main>
  );
}
