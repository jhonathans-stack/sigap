CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super')),
  cpf VARCHAR(20) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  foto_url TEXT,
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
