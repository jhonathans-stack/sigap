CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super')),
  cpf VARCHAR(20) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  foto_url TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens (
  id SERIAL PRIMARY KEY,
  nome_item VARCHAR(120) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(80),
  local_encontrado VARCHAR(160),
  data_achado DATE,
  turno VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'noite') OR turno IS NULL),
  status VARCHAR(30) NOT NULL DEFAULT 'achado' CHECK (status IN ('achado', 'perdido', 'aguardando_coleta', 'devolvido')),
  imagem_url TEXT,
  imagens_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cadastrado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  entregue_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  solicitado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  solicitado_em TIMESTAMP WITH TIME ZONE,
  confirmado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  confirmado_em TIMESTAMP WITH TIME ZONE,
  codigo_coleta_hash TEXT,
  codigo_coleta_criado_em TIMESTAMP WITH TIME ZONE,
  quem_retirou_nome VARCHAR(120),
  quem_retirou_documento VARCHAR(60),
  motivo_devolucao TEXT,
  data_entrega TIMESTAMP WITH TIME ZONE,
  motivo_estorno TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_status ON itens (status);
CREATE INDEX IF NOT EXISTS idx_itens_categoria ON itens (categoria);
CREATE INDEX IF NOT EXISTS idx_itens_nome_item_lower ON itens (LOWER(nome_item));

CREATE TABLE IF NOT EXISTS solicitacoes_perdidos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES itens(id) ON DELETE SET NULL,
  nome_item VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  data_perda DATE NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  local_provavel VARCHAR(160) NOT NULL,
  caracteristicas TEXT NOT NULL,
  imagem_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'alerta_ativo' CHECK (status IN ('alerta_ativo', 'cancelado', 'encontrado')),
  item_match_id INTEGER REFERENCES itens(id) ON DELETE SET NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_perdidos_usuario ON solicitacoes_perdidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_perdidos_status ON solicitacoes_perdidos (status);

CREATE TABLE IF NOT EXISTS coletas_itens (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES itens(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_coleta VARCHAR(6) NOT NULL,
  codigo_coleta_hash TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'aguardando_coleta' CHECK (status IN ('aguardando_coleta', 'devolvido', 'cancelado')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usado_em TIMESTAMP WITH TIME ZONE,
  cancelado_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_coletas_itens_item ON coletas_itens (item_id);
CREATE INDEX IF NOT EXISTS idx_coletas_itens_usuario ON coletas_itens (usuario_id);
CREATE INDEX IF NOT EXISTS idx_coletas_itens_status ON coletas_itens (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coletas_itens_codigo_unico ON coletas_itens (codigo_coleta);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coletas_itens_codigo_ativo ON coletas_itens (codigo_coleta) WHERE status = 'aguardando_coleta';

CREATE TABLE IF NOT EXISTS entregas_itens (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES itens(id) ON DELETE SET NULL,
  usuario_solicitante_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  entregue_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  coletor_nome VARCHAR(120) NOT NULL,
  coletor_documento VARCHAR(60) NOT NULL,
  coletor_email VARCHAR(160),
  detalhes_item JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entregas_itens_item ON entregas_itens (item_id);
CREATE INDEX IF NOT EXISTS idx_entregas_itens_criado_em ON entregas_itens (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_itens_coletor ON entregas_itens (LOWER(coletor_nome), LOWER(coletor_documento));

CREATE TABLE IF NOT EXISTS p2p_conversas (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES itens(id) ON DELETE CASCADE,
  dono_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  encontrado_por_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_entrega VARCHAR(6) NOT NULL,
  codigo_entrega_hash TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'devolvida', 'cancelada')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entregue_em TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_p2p_conversas_codigo ON p2p_conversas (codigo_entrega);
CREATE INDEX IF NOT EXISTS idx_p2p_conversas_item ON p2p_conversas (item_id);
CREATE INDEX IF NOT EXISTS idx_p2p_conversas_participantes ON p2p_conversas (dono_id, encontrado_por_id);

CREATE TABLE IF NOT EXISTS p2p_mensagens (
  id SERIAL PRIMARY KEY,
  conversa_id INTEGER REFERENCES p2p_conversas(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  texto TEXT,
  imagem_url TEXT,
  lida_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_p2p_mensagens_conversa ON p2p_mensagens (conversa_id, criado_em);

CREATE TABLE IF NOT EXISTS auditoria_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id INTEGER,
  detalhes JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_criado_em ON auditoria_logs (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_entidade ON auditoria_logs (entidade, entidade_id);
