export type UserRole = "user" | "admin" | "super";

export type User = {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  cpf?: string | null;
  matricula?: string | null;
  foto_url?: string | null;
  criado_em?: string;
};

export type ItemStatus = "achado" | "aguardando_retirada" | "entregue";

export type Item = {
  id: number;
  nome_item: string;
  descricao?: string | null;
  categoria?: string | null;
  local_encontrado?: string | null;
  data_achado?: string | null;
  status: ItemStatus;
  imagem_url?: string | null;
  cadastrado_por_id?: number | null;
  entregue_por_id?: number | null;
  solicitado_por_id?: number | null;
  solicitado_em?: string | null;
  confirmado_por_id?: number | null;
  confirmado_em?: string | null;
  quem_retirou_nome?: string | null;
  quem_retirou_documento?: string | null;
  motivo_devolucao?: string | null;
  data_entrega?: string | null;
  motivo_estorno?: string | null;
  criado_em?: string;
  atualizado_em?: string;
};

export type LoginResponse = {
  mensagem: string;
  token: string;
  usuario: User;
};

export type RegisterResponse = LoginResponse;

export type ItemMutationResponse = {
  mensagem: string;
  item: Item;
};

export type ItemFilters = {
  nome?: string;
  categoria?: string;
  local?: string;
  status?: ItemStatus | "";
  ordem?: "recentes" | "antigos";
};

export type UserDeleteResponse = {
  mensagem: string;
  usuario: User;
};

export type UserCreateResponse = UserDeleteResponse;

export type LostItemRequest = {
  id: number;
  usuario_id: number;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  nome_item: string;
  categoria: string;
  data_perda: string;
  turno: "manha" | "tarde" | "noite";
  local_provavel: string;
  caracteristicas: string;
  imagem_url?: string | null;
  status: "alerta_ativo" | "cancelado" | "encontrado";
  item_match_id?: number | null;
  criado_em?: string;
  atualizado_em?: string;
};

export type LostItemResponse = {
  mensagem: string;
  solicitacao: LostItemRequest;
};

export type AuditLog = {
  id: number;
  usuario_id?: number | null;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  acao: string;
  entidade: string;
  entidade_id?: number | null;
  detalhes?: Record<string, unknown>;
  criado_em: string;
};
