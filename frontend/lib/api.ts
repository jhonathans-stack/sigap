"use client";

import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import type {
  Item,
  ItemFilters,
  ItemMutationResponse,
  AuditLog,
  DeliveryReport,
  LoginResponse,
  LostItemRequest,
  LostItemResponse,
  P2PConversation,
  P2PMessage,
  P2PReport,
  RegisterResponse,
  User,
  UserCreateResponse,
  UserDeleteResponse
} from "@/lib/types";
import { clearSession, getStoredToken } from "@/lib/storage";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sigap-backend-ftt8.onrender.com";

type SigapError = AxiosError<{ erro?: string }> & {
  sigapMessage?: string;
};

export function getApiErrorMessage(error: unknown, fallback = "Nao foi possivel concluir a operacao.") {
  const sigapError = error as SigapError;
  return sigapError.sigapMessage || sigapError.response?.data?.erro || sigapError.message || fallback;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: SigapError) => {
    const message = error.response?.data?.erro || "Erro inesperado ao comunicar com a API.";
    error.sigapMessage = message;

    if (!error.response) {
      toast.error(message);
    }

    if (typeof window !== "undefined" && error.response?.status === 401) {
      const isPublicAuthPage = ["/login", "/register"].includes(window.location.pathname);

      if (!isPublicAuthPage) {
        clearSession();
        toast.error("Sessão expirada. Faça login novamente.");
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  async login(email: string, senha: string) {
    const { data } = await api.post<LoginResponse>("/api/auth/login", { email, senha });
    return data;
  },

  async me() {
    const { data } = await api.get<{ usuario: LoginResponse["usuario"] }>("/api/auth/me");
    return data;
  },

  async register(payload: FormData | { nome: string; email: string; senha: string; cpf: string; matricula: string }) {
    const { data } = await api.post<RegisterResponse>("/api/auth/register", payload);
    return data;
  }
};

export const itensApi = {
  async list(filters: ItemFilters = {}) {
    const params = new URLSearchParams();

    if (filters.nome?.trim()) {
      params.set("nome", filters.nome.trim());
    }

    if (filters.categoria?.trim()) {
      params.set("categoria", filters.categoria.trim());
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.local?.trim()) {
      params.set("local", filters.local.trim());
    }

    if (filters.ordem) {
      params.set("ordem", filters.ordem);
    }

    const query = params.toString();
    const { data } = await api.get<Item[]>(query ? `/api/itens?${query}` : "/api/itens");
    return data;
  },

  async myRequests() {
    const { data } = await api.get<Item[]>("/api/itens/minhas-solicitacoes");
    return data;
  },

  async create(formData: FormData) {
    const { data } = await api.post<ItemMutationResponse>("/api/itens", formData);
    return data;
  },

  async update(id: number, payload: Partial<Item> | FormData) {
    const { data } = await api.put<ItemMutationResponse>(`/api/itens/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<{ mensagem: string }>(`/api/itens/${id}`);
    return data;
  },

  async requestReturn(id: number) {
    const { data } = await api.post<ItemMutationResponse>(`/api/itens/${id}/solicitar-devolucao`);
    return data;
  },

  async listForCollection(filters: { busca?: string } = {}) {
    const params = new URLSearchParams();

    if (filters.busca?.trim()) {
      params.set("busca", filters.busca.trim());
    }

    const query = params.toString();
    const { data } = await api.get<Item[]>(query ? `/api/itens/para-coleta?${query}` : "/api/itens/para-coleta");
    return data;
  },

  async confirmCollection(id: number, payload: { codigo: string }) {
    const { data } = await api.post<ItemMutationResponse>(`/api/itens/${id}/confirmar-coleta`, payload);
    return data;
  },

  async deliveredReports(filters: { busca?: string; categoria?: string; local?: string } = {}) {
    const params = new URLSearchParams();

    if (filters.busca?.trim()) {
      params.set("busca", filters.busca.trim());
    }

    if (filters.categoria?.trim()) {
      params.set("categoria", filters.categoria.trim());
    }

    if (filters.local?.trim()) {
      params.set("local", filters.local.trim());
    }

    const query = params.toString();
    const { data } = await api.get<DeliveryReport[]>(query ? `/api/itens/entregues?${query}` : "/api/itens/entregues");
    return data;
  }
};

export const usuariosApi = {
  async list() {
    const { data } = await api.get<User[]>("/api/usuarios");
    return data;
  },

  async createAdmin(payload: { nome: string; email: string; senha: string; cpf: string; matricula: string }) {
    const { data } = await api.post<UserCreateResponse>("/api/usuarios/admins", payload);
    return data;
  },

  async promoteToSuper(id: number) {
    const { data } = await api.patch<UserCreateResponse>(`/api/usuarios/${id}/promover-super`);
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<UserDeleteResponse>(`/api/usuarios/${id}`);
    return data;
  }
};

export const lostItemsApi = {
  async matches(payload: {
    nome_item: string;
    categoria: string;
    local_provavel: string;
    caracteristicas: string;
  }) {
    const { data } = await api.post<Item[]>("/api/perdidos/matches", payload);
    return data;
  },

  async create(formData: FormData) {
    const { data } = await api.post<LostItemResponse>("/api/perdidos", formData);
    return data;
  },

  async mine() {
    const { data } = await api.get<LostItemRequest[]>("/api/perdidos/minhas");
    return data;
  },

  async listAll() {
    const { data } = await api.get<LostItemRequest[]>("/api/perdidos");
    return data;
  },

  async markFound(id: number) {
    const { data } = await api.patch<LostItemResponse>(`/api/perdidos/${id}/ja-encontrei`);
    return data;
  }
};

export const auditApi = {
  async list() {
    const { data } = await api.get<AuditLog[]>("/api/auditoria");
    return data;
  },

  async exportItemsCsv() {
    const { data } = await api.get<Blob>("/api/auditoria/export-itens", {
      responseType: "blob"
    });
    return data;
  }
};

export const p2pApi = {
  async reportFound(itemId: number) {
    const { data } = await api.post<{ mensagem: string; conversa: P2PConversation }>(`/api/p2p/itens/${itemId}/achei`);
    return data;
  },

  async conversations() {
    const { data } = await api.get<P2PConversation[]>("/api/p2p/conversas");
    return data;
  },

  async messages(id: number) {
    const { data } = await api.get<{ conversa: P2PConversation; mensagens: P2PMessage[] }>(`/api/p2p/conversas/${id}/mensagens`);
    return data;
  },

  async sendMessage(id: number, payload: FormData) {
    const { data } = await api.post<{ mensagem: string; dado: P2PMessage }>(`/api/p2p/conversas/${id}/mensagens`, payload);
    return data;
  },

  async confirmDelivery(id: number, codigo: string) {
    const { data } = await api.post<ItemMutationResponse>(`/api/p2p/conversas/${id}/confirmar-entrega`, { codigo });
    return data;
  },

  async reports() {
    const { data } = await api.get<P2PReport[]>("/api/p2p/relatorios");
    return data;
  }
};
