CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super')),
  cpf VARCHAR(20),
  matricula VARCHAR(50),
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
  status VARCHAR(20) NOT NULL DEFAULT 'achado' CHECK (status IN ('achado', 'entregue')),
  imagem_url TEXT,
  cadastrado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  entregue_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
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
