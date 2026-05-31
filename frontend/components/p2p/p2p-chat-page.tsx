"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ImagePlus, KeyRound, MessageCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { useAuth } from "@/components/providers/auth-provider";
import { FigmaButton, FigmaCard } from "@/components/ui/figma-primitives";
import { getApiErrorMessage, p2pApi } from "@/lib/api";
import type { P2PConversation, P2PMessage } from "@/lib/types";
import { formatDateTime, getItemImageUrl } from "@/lib/utils";

function presenceLabel(online?: boolean, lastSeen?: string | null) {
  if (online) {
    return "Online agora";
  }

  if (!lastSeen) {
    return "Sem atividade recente";
  }

  return `Visto por último em ${formatDateTime(lastSeen)}`;
}

export function P2PChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const requestedConversation = Number(searchParams.get("conversa") || 0);
  const [conversations, setConversations] = useState<P2PConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(requestedConversation || null);
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);

    try {
      const data = await p2pApi.conversations();
      setConversations(data);
      if (!selectedId && data.length) {
        setSelectedId(requestedConversation || data[0].id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar conversas."));
    } finally {
      setLoading(false);
    }
  }, [requestedConversation, selectedId]);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const data = await p2pApi.messages(conversationId);
      setMessages(data.mensagens);
      setConversations((current) => current.map((item) => (item.id === data.conversa.id ? data.conversa : item)));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar mensagens."));
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      void loadMessages(selectedId);
    }
  }, [loadMessages, selectedId]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedId || sending) {
      return;
    }

    if (!text.trim() && !imageFile) {
      toast.error("Escreva uma mensagem ou selecione uma imagem.");
      return;
    }

    const formData = new FormData();
    formData.append("texto", text.trim());
    if (imageFile) {
      formData.append("imagem", imageFile);
    }

    setSending(true);

    try {
      await p2pApi.sendMessage(selectedId, formData);
      setText("");
      setImageFile(null);
      await loadMessages(selectedId);
      await loadConversations();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível enviar a mensagem."));
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmDelivery() {
    if (!selectedId || confirming) {
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(code.trim().toUpperCase())) {
      toast.error("Informe o código de 6 caracteres.");
      return;
    }

    setConfirming(true);

    try {
      await p2pApi.confirmDelivery(selectedId, code.trim().toUpperCase());
      toast.success("Entrega P2P confirmada.");
      setCode("");
      await loadConversations();
      await loadMessages(selectedId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível confirmar a entrega."));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Conversas P2P</h1>
            <p className="text-gray-600 dark:text-gray-400">Converse com segurança sobre itens perdidos encontrados por outros usuários.</p>
          </div>
          <FigmaButton type="button" variant="secondary" onClick={loadConversations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </FigmaButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <FigmaCard className="overflow-hidden">
            <div className="border-b border-gray-200 p-4 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">Conversas</div>
            <div className="max-h-[70vh] overflow-y-auto">
              {conversations.length ? (
                conversations.map((conversation) => {
                  const imageUrl = getItemImageUrl(conversation.item.imagem_url);
                  const active = conversation.id === selectedId;

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      className={`flex w-full gap-3 border-b border-gray-100 p-4 text-left transition-colors dark:border-gray-700 ${active ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                        {imageUrl ? <img src={imageUrl} alt={conversation.item.nome_item} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">{conversation.item.nome_item}</p>
                          {conversation.mensagens_nao_lidas ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{conversation.mensagens_nao_lidas}</span> : null}
                        </div>
                        <p className="truncate text-sm text-gray-600 dark:text-gray-400">{conversation.outro_usuario.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{presenceLabel(conversation.outro_usuario.online, conversation.outro_usuario.last_seen)}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma conversa P2P aberta.</div>
              )}
            </div>
          </FigmaCard>

          <FigmaCard className="flex min-h-[70vh] flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      {selectedConversation.outro_usuario.foto_url ? <img src={getItemImageUrl(selectedConversation.outro_usuario.foto_url) || ""} alt={selectedConversation.outro_usuario.nome} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{selectedConversation.outro_usuario.nome}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{presenceLabel(selectedConversation.outro_usuario.online, selectedConversation.outro_usuario.last_seen)}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{selectedConversation.status}</span>
                </div>

                {selectedConversation.codigo_entrega ? (
                  <div className="border-b border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <div className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Código de entrega</div>
                    <p className="mt-1 text-2xl font-bold tracking-[0.25em]">{selectedConversation.codigo_entrega}</p>
                    <p className="mt-1 text-sm">Passe este código somente no momento da devolução do item.</p>
                  </div>
                ) : null}

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.map((message) => {
                    const mine = message.usuario_id === user?.id;
                    const imageUrl = getItemImageUrl(message.imagem_url);

                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"}`}>
                          <p className="mb-1 text-xs font-semibold opacity-80">{message.usuario_nome || "Usuário"}</p>
                          {message.texto ? <p className="whitespace-pre-wrap">{message.texto}</p> : null}
                          {imageUrl ? <img src={imageUrl} alt="Imagem enviada no chat" className="mt-2 max-h-64 rounded-xl object-contain" /> : null}
                          <p className="mt-2 text-right text-[11px] opacity-70">{mine ? (message.lida_em ? "Lida" : "Enviada") : formatDateTime(message.criado_em)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedConversation.encontrado_por_id === user?.id && selectedConversation.status === "aberta" ? (
                  <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input className="sigap-input" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="Código de entrega" />
                      <FigmaButton type="button" onClick={handleConfirmDelivery} loading={confirming}>Confirmar entrega</FigmaButton>
                    </div>
                  </div>
                ) : null}

                {selectedConversation.status === "aberta" ? (
                  <form className="border-t border-gray-200 p-4 dark:border-gray-700" onSubmit={handleSend}>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input className="sigap-input flex-1" value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva uma mensagem..." />
                      <label className="sigap-secondary inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
                        <ImagePlus className="h-4 w-4" />
                        Imagem
                        <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageChange} />
                      </label>
                      <FigmaButton type="submit" loading={sending}>
                        <Send className="h-4 w-4" />
                        Enviar
                      </FigmaButton>
                    </div>
                    {imageFile ? <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Imagem selecionada: {imageFile.name}</p> : null}
                  </form>
                ) : null}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="mb-4 h-16 w-16" />
                Selecione uma conversa para começar.
              </div>
            )}
          </FigmaCard>
        </div>
      </section>
    </main>
  );
}
