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

export type ItemStatus = "achado" | "entregue";

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
  status?: ItemStatus | "";
};

export type UserDeleteResponse = {
  mensagem: string;
  usuario: User;
};
