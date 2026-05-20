const pool = require("../config/db");
const AppError = require("../utils/AppError");
const auditService = require("./auditService");
const { isValidDate } = require("../utils/validators");

const requiredText = (payload, field, label, min = 2) => {
  const value = String(payload[field] || "").trim();

  if (value.length < min) {
    throw new AppError(`${label} e obrigatorio.`, 400);
  }

  return value;
};

const validatePayload = (payload) => {
  const nomeItem = requiredText(payload, "nome_item", "Nome do objeto");
  const categoria = requiredText(payload, "categoria", "Categoria");
  const localProvavel = requiredText(payload, "local_provavel", "Local provavel");
  const caracteristicas = requiredText(payload, "caracteristicas", "Caracteristicas marcantes", 5);
  const dataPerda = String(payload.data_perda || "").trim();
  const turno = String(payload.turno || "").trim();

  if (!isValidDate(dataPerda)) {
    throw new AppError("Data do sumico invalida.", 400);
  }

  if (!["manha", "tarde", "noite"].includes(turno)) {
    throw new AppError("Turno deve ser manha, tarde ou noite.", 400);
  }

  return {
    nomeItem,
    categoria,
    localProvavel,
    caracteristicas,
    dataPerda,
    turno
  };
};

const normalizeForSearch = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const findMatches = async (payload) => {
  const nome = normalizeForSearch(payload.nome_item);
  const categoria = normalizeForSearch(payload.categoria);
  const local = normalizeForSearch(payload.local_provavel);
  const caracteristicas = normalizeForSearch(payload.caracteristicas);

  const terms = Array.from(new Set(
    `${nome} ${caracteristicas}`
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4)
  )).slice(0, 8);

  const result = await pool.query(
    `SELECT *
     FROM itens
     WHERE status IN ('achado', 'aguardando_retirada')
     ORDER BY criado_em DESC, id DESC
     LIMIT 80`
  );

  return result.rows
    .map((item) => {
      const itemText = normalizeForSearch(`${item.nome_item} ${item.descricao} ${item.categoria} ${item.local_encontrado}`);
      let score = 0;

      if (categoria && normalizeForSearch(item.categoria) === categoria) {
        score += 4;
      }

      if (local && normalizeForSearch(item.local_encontrado).includes(local)) {
        score += 2;
      }

      terms.forEach((term) => {
        if (itemText.includes(term)) {
          score += 1;
        }
      });

      return { item, score };
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => item);
};

const scoreRequestAgainstItem = (request, item) => {
  const requestTerms = Array.from(new Set(
    `${request.nome_item} ${request.caracteristicas}`
      .split(/\s+/)
      .map((term) => normalizeForSearch(term))
      .filter((term) => term.length >= 4)
  )).slice(0, 8);

  const itemText = normalizeForSearch(`${item.nome_item} ${item.descricao} ${item.categoria} ${item.local_encontrado}`);
  let score = 0;

  if (normalizeForSearch(request.categoria) === normalizeForSearch(item.categoria)) {
    score += 4;
  }

  if (normalizeForSearch(item.local_encontrado).includes(normalizeForSearch(request.local_provavel))) {
    score += 2;
  }

  requestTerms.forEach((term) => {
    if (itemText.includes(term)) {
      score += 1;
    }
  });

  return score;
};

const matchActiveRequestsForItem = async (item, user) => {
  const result = await pool.query(
    `SELECT *
     FROM solicitacoes_perdidos
     WHERE status = 'alerta_ativo'
     ORDER BY criado_em DESC, id DESC
     LIMIT 200`
  );

  const matches = result.rows
    .map((request) => ({ request, score: scoreRequestAgainstItem(request, item) }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score);

  for (const { request, score } of matches) {
    await pool.query(
      `UPDATE solicitacoes_perdidos
       SET status = 'encontrado',
           item_match_id = $2,
           atualizado_em = NOW()
       WHERE id = $1 AND status = 'alerta_ativo'`,
      [request.id, item.id]
    );

    await auditService.logAction({
      usuarioId: user?.id,
      acao: "match_automatico_detectado",
      entidade: "solicitacoes_perdidos",
      entidadeId: request.id,
      detalhes: {
        item_id: item.id,
        nome_item: item.nome_item,
        score
      }
    });
  }

  return matches.map(({ request }) => request);
};

const createLostItem = async (payload, uploadedImageUrl, user) => {
  const data = validatePayload(payload);

  const result = await pool.query(
    `INSERT INTO solicitacoes_perdidos (
       usuario_id,
       nome_item,
       categoria,
       data_perda,
       turno,
       local_provavel,
       caracteristicas,
       imagem_url
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      user.id,
      data.nomeItem,
      data.categoria,
      data.dataPerda,
      data.turno,
      data.localProvavel,
      data.caracteristicas,
      uploadedImageUrl || null
    ]
  );

  await auditService.logAction({
    usuarioId: user.id,
    acao: "solicitacao_perdido_criada",
    entidade: "solicitacoes_perdidos",
    entidadeId: result.rows[0].id,
    detalhes: { nome_item: data.nomeItem, categoria: data.categoria }
  });

  return result.rows[0];
};

const listMine = async (user) => {
  const result = await pool.query(
    `SELECT *
     FROM solicitacoes_perdidos
     WHERE usuario_id = $1
     ORDER BY criado_em DESC, id DESC`,
    [user.id]
  );

  return result.rows;
};

const listAll = async () => {
  const result = await pool.query(
    `SELECT s.*, u.nome AS usuario_nome, u.email AS usuario_email
     FROM solicitacoes_perdidos s
     LEFT JOIN usuarios u ON u.id = s.usuario_id
     ORDER BY s.criado_em DESC, s.id DESC`
  );

  return result.rows;
};

module.exports = {
  findMatches,
  matchActiveRequestsForItem,
  createLostItem,
  listMine,
  listAll
};
