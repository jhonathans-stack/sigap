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

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  if (dataPerda > todayKey) {
    throw new AppError("A data do sumico nao pode ser futura.", 400);
  }

  if (!["manha", "tarde", "noite"].includes(turno)) {
    throw new AppError("Turno deve ser manha, tarde ou noite.", 400);
  }

  if (dataPerda === todayKey) {
    const hour = today.getHours();
    const currentTurno = hour < 12 ? "manha" : hour < 18 ? "tarde" : "noite";
    const order = { manha: 1, tarde: 2, noite: 3 };

    if (order[turno] > order[currentTurno]) {
      throw new AppError("O turno nao pode ser posterior ao turno atual.", 400);
    }
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

const normalizeImageUrls = (urls = []) => {
  const list = Array.isArray(urls) ? urls : [urls];
  return Array.from(new Set(list.map((url) => String(url || "").trim()).filter(Boolean)));
};

const findMatches = async (payload) => {
  const nome = normalizeForSearch(payload.nome_item);
  const categoria = normalizeForSearch(payload.categoria);
  const local = normalizeForSearch(payload.local_provavel);
  const caracteristicas = normalizeForSearch(payload.caracteristicas);

  const terms = Array.from(new Set(
    `${nome} ${caracteristicas} ${categoria} ${local}`
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4)
  )).slice(0, 8);

  const result = await pool.query(
    `SELECT *
     FROM itens
     WHERE status = 'achado'
     ORDER BY criado_em DESC, id DESC
     LIMIT 80`
  );

  return result.rows
    .map((item) => {
      const itemText = normalizeForSearch(`${item.nome_item} ${item.descricao} ${item.categoria} ${item.local_encontrado}`);
      let score = 0;

      if (categoria && normalizeForSearch(item.categoria) === categoria) {
        score += 3;
      }

      if (local && normalizeForSearch(item.local_encontrado).includes(local)) {
        score += 1;
      }

      terms.forEach((term) => {
        if (itemText.includes(term)) {
          score += 2;
        }
      });

      return { item, score };
    })
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => item);
};

const scoreRequestAgainstItem = (request, item) => {
  const requestTerms = Array.from(new Set(
    `${request.nome_item} ${request.caracteristicas} ${request.categoria} ${request.local_provavel}`
      .split(/\s+/)
      .map((term) => normalizeForSearch(term))
      .filter((term) => term.length >= 4)
  )).slice(0, 8);

  const itemText = normalizeForSearch(`${item.nome_item} ${item.descricao} ${item.categoria} ${item.local_encontrado}`);
  let score = 0;

  if (normalizeForSearch(request.categoria) === normalizeForSearch(item.categoria)) {
    score += 3;
  }

  if (normalizeForSearch(item.local_encontrado).includes(normalizeForSearch(request.local_provavel))) {
    score += 1;
  }

  requestTerms.forEach((term) => {
    if (itemText.includes(term)) {
      score += 2;
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
    .filter(({ score }) => score >= 3)
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
  const imageUrls = normalizeImageUrls(uploadedImageUrl);
  const primaryImageUrl = imageUrls[0] || null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemResult = await client.query(
      `INSERT INTO itens (
         nome_item,
         descricao,
         categoria,
         local_encontrado,
         data_achado,
         turno,
         status,
         imagem_url,
         imagens_urls,
         cadastrado_por_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'perdido', $7, $8, $9)
       RETURNING *`,
      [
        data.nomeItem,
        data.caracteristicas,
        data.categoria,
        data.localProvavel,
        data.dataPerda,
        data.turno,
        primaryImageUrl,
        imageUrls,
        user.id
      ]
    );

    const result = await client.query(
      `INSERT INTO solicitacoes_perdidos (
         usuario_id,
         item_id,
         nome_item,
         categoria,
         data_perda,
         turno,
         local_provavel,
         caracteristicas,
         imagem_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user.id,
        itemResult.rows[0].id,
        data.nomeItem,
        data.categoria,
        data.dataPerda,
        data.turno,
        data.localProvavel,
        data.caracteristicas,
        primaryImageUrl
      ]
    );

    await client.query("COMMIT");

    await auditService.logAction({
      usuarioId: user.id,
      acao: "solicitacao_perdido_criada",
      entidade: "solicitacoes_perdidos",
      entidadeId: result.rows[0].id,
      detalhes: { nome_item: data.nomeItem, categoria: data.categoria, item_id: itemResult.rows[0].id }
    });

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

const markAsFoundByOwner = async (id, user) => {
  if (!/^\d+$/.test(String(id)) || Number(id) <= 0) {
    throw new AppError("ID da solicitacao invalido.", 400);
  }

  const current = await pool.query(
    `SELECT *
     FROM solicitacoes_perdidos
     WHERE id = $1 AND usuario_id = $2`,
    [Number(id), user.id]
  );

  if (!current.rowCount) {
    throw new AppError("Solicitacao nao encontrada para este usuario.", 404);
  }

  const request = current.rows[0];
  if (request.status !== "alerta_ativo") {
    throw new AppError("Esta solicitacao nao esta ativa.", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `UPDATE solicitacoes_perdidos
       SET status = 'encontrado',
           atualizado_em = NOW()
       WHERE id = $1 AND usuario_id = $2
       RETURNING *`,
      [Number(id), user.id]
    );

    if (request.item_id) {
      await client.query(
        `UPDATE itens
         SET status = 'devolvido',
             confirmado_por_id = $2,
             confirmado_em = NOW(),
             data_entrega = NOW(),
             atualizado_em = NOW()
         WHERE id = $1 AND cadastrado_por_id = $2 AND status = 'perdido'`,
        [request.item_id, user.id]
      );
    }

    await client.query("COMMIT");

    await auditService.logAction({
      usuarioId: user.id,
      acao: "solicitacao_perdido_marcada_como_encontrada",
      entidade: "solicitacoes_perdidos",
      entidadeId: requestResult.rows[0].id,
      detalhes: { nome_item: request.nome_item, item_id: request.item_id }
    });

    return requestResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  findMatches,
  matchActiveRequestsForItem,
  createLostItem,
  listMine,
  listAll,
  markAsFoundByOwner
};
