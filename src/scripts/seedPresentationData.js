require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { initializeDatabase } = require("../services/databaseService");

const demoPassword = process.env.SIGAP_DEMO_PASSWORD || `sigap-${crypto.randomBytes(4).toString("hex")}`;
const cpfSeed = Number(String(Date.now()).slice(-8));

const buildDemoCpf = (index) => {
  return String(70000000000 + cpfSeed + index).slice(0, 11);
};

const users = [
  {
    nome: "Ana Beatriz Costa",
    email: "ana.beatriz@sigap.demo",
    role: "user",
    matricula: "20261SI0101"
  },
  {
    nome: "Rafael Martins Lima",
    email: "rafael.martins@sigap.demo",
    role: "user",
    matricula: "20261ADM0202"
  },
  {
    nome: "Marina Sousa Ribeiro",
    email: "marina.sousa@sigap.demo",
    role: "user",
    matricula: "20261INFO0303"
  },
  {
    nome: "Admin Biblioteca",
    email: "admin.biblioteca@sigap.demo",
    role: "admin",
    matricula: "ADM-BIB-001"
  },
  {
    nome: "Admin Assistencia Estudantil",
    email: "admin.cae@sigap.demo",
    role: "admin",
    matricula: "ADM-CAE-002"
  }
];

const items = [
  {
    nome_item: "Carteira preta",
    descricao: "Carteira de couro sintético com divisórias internas. Encontrada próxima às mesas de estudo.",
    categoria: "documentos",
    local_encontrado: "Biblioteca central",
    data_achado: "2026-05-06",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Fone de ouvido Bluetooth",
    descricao: "Fone sem fio preto, com estojo carregador. Item aguardando reconhecimento pelo proprietário.",
    categoria: "eletrônicos",
    local_encontrado: "Laboratório de informática 2",
    data_achado: "2026-05-08",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Caderno universitário",
    descricao: "Caderno espiral com anotações de cálculo e capa azul.",
    categoria: "material escolar",
    local_encontrado: "Sala B-204",
    data_achado: "2026-05-09",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Garrafa térmica azul",
    descricao: "Garrafa metálica azul com pequenos adesivos na lateral.",
    categoria: "acessórios",
    local_encontrado: "Cantina",
    data_achado: "2026-05-10",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Mochila cinza",
    descricao: "Mochila com compartimento para notebook e chaveiro pequeno preso ao zíper.",
    categoria: "acessórios",
    local_encontrado: "Auditório principal",
    data_achado: "2026-05-11",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Calculadora científica",
    descricao: "Calculadora preta usada em aula de física. Já foi devolvida após conferência dos dados.",
    categoria: "material escolar",
    local_encontrado: "Sala C-103",
    data_achado: "2026-05-12",
    status: "entregue",
    quem_retirou_nome: "Lucas Almeida",
    quem_retirou_documento: "RG 0000000",
    motivo_devolucao: "Proprietário reconheceu o item e apresentou documento.",
    data_entrega: "2026-05-13T14:30:00.000Z",
    imagem_url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Óculos de grau",
    descricao: "Óculos com armação preta e estojo rígido. Encontrado no corredor do bloco administrativo.",
    categoria: "acessórios",
    local_encontrado: "Bloco administrativo",
    data_achado: "2026-05-14",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Guarda-chuva preto",
    descricao: "Guarda-chuva dobrável com capa. Item localizado após o encerramento das aulas.",
    categoria: "outros",
    local_encontrado: "Entrada principal",
    data_achado: "2026-05-15",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Cartão estudantil",
    descricao: "Cartão estudantil sem dados sensíveis visíveis na descrição pública.",
    categoria: "documentos",
    local_encontrado: "Secretaria acadêmica",
    data_achado: "2026-05-16",
    status: "entregue",
    quem_retirou_nome: "Carla Mendes",
    quem_retirou_documento: "CPF conferido internamente",
    motivo_devolucao: "Retirada confirmada pela secretaria.",
    data_entrega: "2026-05-16T18:10:00.000Z",
    imagem_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80"
  },
  {
    nome_item: "Chaveiro com duas chaves",
    descricao: "Chaveiro metálico com duas chaves pequenas e pingente azul.",
    categoria: "acessórios",
    local_encontrado: "Pátio central",
    data_achado: "2026-05-17",
    status: "achado",
    imagem_url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=900&q=80"
  }
];

const lostRequests = [
  {
    userEmail: "ana.beatriz@sigap.demo",
    nome_item: "Fone bluetooth preto",
    categoria: "eletronicos",
    data_perda: "2026-05-08",
    turno: "tarde",
    local_provavel: "Laboratorios do Monte Castelo",
    caracteristicas: "Fone preto com estojo pequeno e marcas de uso",
    status: "encontrado",
    matchItemName: "Fone de ouvido Bluetooth"
  },
  {
    userEmail: "rafael.martins@sigap.demo",
    nome_item: "Chaveiro com pingente azul",
    categoria: "acessorios",
    data_perda: "2026-05-17",
    turno: "manha",
    local_provavel: "Patio central",
    caracteristicas: "Chaveiro metalico com duas chaves e pingente azul",
    status: "encontrado",
    matchItemName: "Chaveiro com duas chaves"
  },
  {
    userEmail: "marina.sousa@sigap.demo",
    nome_item: "Blusa de frio preta",
    categoria: "vestuario",
    data_perda: "2026-05-18",
    turno: "noite",
    local_provavel: "Biblioteca",
    caracteristicas: "Blusa preta com iniciais pequenas na etiqueta",
    status: "alerta_ativo"
  }
];

async function upsertUser(user, senhaHash, index) {
  const cpf = user.cpf || buildDemoCpf(index);

  const result = await pool.query(
    `INSERT INTO usuarios (nome, email, senha, role, cpf, matricula)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       nome = EXCLUDED.nome,
       senha = EXCLUDED.senha,
       role = EXCLUDED.role,
       cpf = EXCLUDED.cpf,
       matricula = EXCLUDED.matricula
     RETURNING id, nome, email, role, matricula`,
    [user.nome, user.email, senhaHash, user.role, cpf, user.matricula]
  );

  return result.rows[0];
}

async function upsertItem(item, adminId) {
  const result = await pool.query(
    `WITH updated AS (
       UPDATE itens
       SET descricao = $2,
           categoria = $3,
           local_encontrado = $4,
           data_achado = $5,
           status = $6,
           imagem_url = $7,
           cadastrado_por_id = $8,
           quem_retirou_nome = $9,
           quem_retirou_documento = $10,
           motivo_devolucao = $11,
           data_entrega = $12,
           atualizado_em = NOW()
       WHERE nome_item = $1
       RETURNING id
     )
     INSERT INTO itens (
       nome_item,
       descricao,
       categoria,
       local_encontrado,
       data_achado,
       status,
       imagem_url,
       cadastrado_por_id,
       quem_retirou_nome,
       quem_retirou_documento,
       motivo_devolucao,
       data_entrega
     )
     SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
     WHERE NOT EXISTS (SELECT 1 FROM updated)
     RETURNING id`,
    [
      item.nome_item,
      item.descricao,
      item.categoria,
      item.local_encontrado,
      item.data_achado,
      item.status,
      item.imagem_url,
      adminId,
      item.quem_retirou_nome || null,
      item.quem_retirou_documento || null,
      item.motivo_devolucao || null,
      item.data_entrega || null
    ]
  );

  if (result.rowCount) {
    return result.rows[0].id;
  }

  const existing = await pool.query("SELECT id FROM itens WHERE nome_item = $1", [item.nome_item]);
  return existing.rows[0].id;
}

async function upsertLostRequest(request) {
  const userResult = await pool.query("SELECT id FROM usuarios WHERE email = $1", [request.userEmail]);
  const user = userResult.rows[0];

  if (!user) {
    return null;
  }

  const matchResult = request.matchItemName
    ? await pool.query("SELECT id FROM itens WHERE nome_item = $1", [request.matchItemName])
    : { rows: [] };
  const matchId = matchResult.rows[0]?.id || null;

  const result = await pool.query(
    `WITH updated AS (
       UPDATE solicitacoes_perdidos
       SET categoria = $3,
           turno = $5,
           local_provavel = $6,
           caracteristicas = $7,
           status = $8,
           item_match_id = $9,
           atualizado_em = NOW()
       WHERE usuario_id = $1 AND nome_item = $2 AND data_perda = $4
       RETURNING id
     )
     INSERT INTO solicitacoes_perdidos (
       usuario_id,
       nome_item,
       categoria,
       data_perda,
       turno,
       local_provavel,
       caracteristicas,
       status,
       item_match_id
     )
     SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
     WHERE NOT EXISTS (SELECT 1 FROM updated)
     RETURNING id`,
    [
      user.id,
      request.nome_item,
      request.categoria,
      request.data_perda,
      request.turno,
      request.local_provavel,
      request.caracteristicas,
      request.status,
      matchId
    ]
  );

  if (result.rowCount) {
    return result.rows[0].id;
  }

  const existing = await pool.query(
    "SELECT id FROM solicitacoes_perdidos WHERE usuario_id = $1 AND nome_item = $2 AND data_perda = $3",
    [user.id, request.nome_item, request.data_perda]
  );
  return existing.rows[0]?.id || null;
}

async function seed() {
  await initializeDatabase();

  const senhaHash = await bcrypt.hash(demoPassword, 10);
  const createdUsers = [];

  for (const [index, user] of users.entries()) {
    createdUsers.push(await upsertUser(user, senhaHash, index));
  }

  const admin = createdUsers.find((user) => user.role === "admin");
  const itemIds = [];

  for (const item of items) {
    itemIds.push(await upsertItem(item, admin.id));
  }

  const lostRequestIds = [];

  for (const request of lostRequests) {
    const id = await upsertLostRequest(request);
    if (id) {
      lostRequestIds.push(id);
    }
  }

  console.log(JSON.stringify({
    mensagem: "Dados ficticios de apresentacao inseridos com sucesso.",
    senha_demo: demoPassword,
    usuarios: createdUsers.map(({ nome, email, role, matricula }) => ({ nome, email, role, matricula })),
    itens_inseridos_ou_atualizados: itemIds.length,
    solicitacoes_perdidos_inseridas_ou_atualizadas: lostRequestIds.length
  }, null, 2));
}

seed()
  .catch((error) => {
    console.error("Erro ao popular dados ficticios:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
