"use client";

import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import type {
  Item,
  ItemFilters,
  ItemMutationResponse,
  LoginResponse,
  RegisterResponse,
  User,
  UserDeleteResponse
} from "@/lib/types";
import { getStoredToken } from "@/lib/storage";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

    return Promise.reject(error);
  }
);

export const authApi = {
  async login(email: string, senha: string) {
    const { data } = await api.post<LoginResponse>("/api/auth/login", { email, senha });
    return data;
  },

  async register(payload: { nome: string; email: string; senha: string; cpf: string }) {
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

    const query = params.toString();
    const { data } = await api.get<Item[]>(query ? `/api/itens?${query}` : "/api/itens");
    return data;
  },

  async create(formData: FormData) {
    const { data } = await api.post<ItemMutationResponse>("/api/itens", formData);
    return data;
  },

  async update(id: number, payload: Partial<Item>) {
    const { data } = await api.put<ItemMutationResponse>(`/api/itens/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<{ mensagem: string }>(`/api/itens/${id}`);
    return data;
  }
};

export const usuariosApi = {
  async list() {
    const { data } = await api.get<User[]>("/api/usuarios");
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<UserDeleteResponse>(`/api/usuarios/${id}`);
    return data;
  }
};
