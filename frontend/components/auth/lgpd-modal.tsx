"use client";

import { X } from "lucide-react";

export function LgpdModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgpd-title"
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="lgpd-title" className="text-xl font-bold text-slate-950 dark:text-white">
              Consentimento LGPD
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Uso responsavel dos dados no DropZone.</p>
          </div>
          <button type="button" onClick={onClose} className="sigap-secondary h-9 w-9 px-0" aria-label="Fechar modal">
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <p>
            Os dados informados serao usados apenas para identificacao, controle de acesso e gestao do sistema de
            achados e perdidos.
          </p>
          <p>
            Nome, email, CPF e foto podem ser utilizados para validar a identidade do usuario no contexto institucional
            do sistema.
          </p>
          <p>
            Ao aceitar, voce declara estar ciente desse tratamento de dados para fins academicos e operacionais do
            DropZone.
          </p>
        </div>

        <button type="button" onClick={onClose} className="sigap-primary mt-6 w-full">
          Entendi
        </button>
      </div>
    </div>
  );
}
