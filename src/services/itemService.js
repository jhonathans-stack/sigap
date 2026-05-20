const pool = require("../config/db");
const AppError = require("../utils/AppError");
const { removeLocalUpload } = require("../utils/fileStorage");
const { isAllowedStatus, isPositiveInteger, isValidDate } = require("../utils/validators");
const auditService = require("./auditService");
const lostItemService = require("./lostItemService");

const toNullableString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length ? text : null;
};

const toNullableInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!isPositiveInteger(value)) {
    throw new AppError(`${fieldName} deve ser um numero inteiro positivo.`, 400);
  }

  return Number(value);
};

const normalizeSqlExpression = (fieldName) => {
  const accentFrom = "\u00e1\u00e0\u00e2\u00e3\u00e4\u00e9\u00e8\u00ea\u00eb\u00ed\u00ec\u00ee\u00ef\u00f3\u00f2\u00f4\u00f5\u00f6\u00fa\u00f9\u00fb\u00fc\u00e7";
  const accentTo = "aaaaaeeeeiiiiooooouuuuc";
  return `TRANSLATE(LOWER(COALESCE(${fieldName}, '')), '${accentFrom}', '${accentTo}')`;
};

const normalizeTextSearch = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const categoryAliases = {
  vestuario: ["vestuario", "roupas"],
  roupas: ["vestuario", "roupas"],
  eletronicos: ["eletronicos", "eletronico"],
  eletronico: ["eletronicos", "eletronico"],
  acessorios: ["acessorios", "acessorio"],
  acessorio: ["acessorios", "acessorio"]
};

const validateItemPayload = (payload, partial = false) => {
  if (!partial || payload.nome_item !== undefined) {
    const nome = toNullableString(payload.nome_item);
    if (!nome || nome.length < 2) {
      throw new AppError("Nome do item deve ter pelo menos 2 caracteres.", 400);
    }
  }

  if (payload.status !== undefined && !isAllowedStatus(payload.status)) {
    throw new AppError("Status deve ser achado, aguardando retirada ou entregue.", 400);
  }

  if (payload.status === "entregue") {
    throw new AppError("Use a confirmacao de recebimento do usuario para marcar um item como entregue.", 400);
  }

  if (!partial || payload.descricao !== undefined) {
    const descricao = toNullableString(payload.descricao);
    if (!descricao || descricao.length < 5) {
      throw new AppError("Descricao deve ter pelo menos 5 caracteres.", 400);
    }
  }

  if (!partial || payload.categoria !== undefined) {
    if (!toNullableString(payload.categoria)) {
      throw new AppError("Categoria e obrigatoria.", 400);
    }
  }

  if (!partial || payload.local_encontrado !== undefined) {
    if (!toNullableString(payload.local_encontrado)) {
      throw new AppError("Local encontrado e obrigatorio.", 400);
    }
  }

  if (!partial || payload.data_achado !== undefined) {
    if (!payload.data_achado) {
      throw new AppError("Data do achado e obrigatoria.", 400);
    }
  }

  if (payload.data_achado !== undefined && payload.data_achado !== "" && !isValidDate(payload.data_achado)) {
    throw new AppError("Data do achado invalida.", 400);
  }

  if (payload.data_entrega !== undefined && payload.data_entrega !== "" && Number.isNaN(Date.parse(payload.data_entrega))) {
    throw new AppError("Data de entrega invalida.", 400);
  }
};

const listItens = async (filters) => {
  const conditions = [];
  const values = [];

  if (filters.nome) {
    values.push(`%${String(filters.nome).trim()}%`);
    conditions.push(`nome_item ILIKE $${values.length}`);
  }

  if (filters.categoria) {
    const normalizedCategory = normalizeTextSearch(filters.categoria);
    values.push(categoryAliases[normalizedCategory] || [normalizedCategory]);
    conditions.push(`${normalizeSqlExpression("categoria")} = ANY($${values.length})`);
  }

  if (filters.local) {
    values.push(`%${normalizeTextSearch(filters.local)}%`);
    conditions.push(`${normalizeSqlExpression("local_encontrado")} LIKE $${values.length}`);
  }

  if (filters.status) {
    if (!isAllowedStatus(filters.status)) {
      throw new AppError("Status deve ser achado, aguardando retirada ou entregue.", 400);
    }

    values.push(String(filters.status).trim());
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT *
     FROM itens
     ${whereClause}
     ORDER BY
       CASE WHEN $${values.length + 1} = 'antigos' THEN criado_em END ASC,
       CASE WHEN $${values.length + 1} <> 'antigos' THEN criado_em END DESC,
       id DESC`,
    [...values, filters.ordem === "antigos" ? "antigos" : "recentes"]
  );

  return result.rows;
};

const listUserRequests = async (user) => {
  const result = await pool.query(
    `SELECT *
     FROM itens
     WHERE solicitado_por_id = $1 OR confirmado_por_id = $1
     ORDER BY atualizado_em DESC, criado_em DESC, id DESC`,
    [user.id]
  );

  return result.rows;
};

const createItem = async (payload, uploadedImageUrl, user) => {
  validateItemPayload(payload);

  const status = String(payload.status || "achado").trim();

  const result = await pool.query(
    `INSERT INTO itens (
       nome_item,
       descricao,
       categoria,
       local_encontrado,
       data_achado,
       status,
       imagem_url,
       cadastrado_por_id,
       entregue_por_id,
       quem_retirou_nome,
       quem_retirou_documento,
       motivo_devolucao,
       data_entrega,
       motivo_estorno
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      toNullableString(payload.nome_item),
      toNullableString(payload.descricao),
      toNullableString(payload.categoria),
      toNullableString(payload.local_encontrado),
      payload.data_achado || null,
      status,
      uploadedImageUrl || toNullableString(payload.imagem_url),
      user?.id || toNullableInteger(payload.cadastrado_por_id, "cadastrado_por_id"),
      toNullableInteger(payload.entregue_por_id, "entregue_por_id"),
      toNullableString(payload.quem_retirou_nome),
      toNullableString(payload.quem_retirou_documento),
      toNullableString(payload.motivo_devolucao),
      null,
      toNullableString(payload.motivo_estorno)
    ]
  );

  await auditService.logAction({
    usuarioId: user?.id,
    acao: "item_criado",
    entidade: "itens",
    entidadeId: result.rows[0].id,
    detalhes: { nome_item: result.rows[0].nome_item, status: result.rows[0].status }
  });

  try {
    await lostItemService.matchActiveRequestsForItem(result.rows[0], user);
  } catch (error) {
    console.warn("Nao foi possivel executar match automatico de itens perdidos.", error.message);
  }

  return result.rows[0];
};

const updateItem = async (id, payload, uploadedImageUrl, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  validateItemPayload(payload, true);

  const fields = [];
  const values = [];
  let previousImageUrl = null;
  const allowedFields = {
    nome_item: (value) => toNullableString(value),
    descricao: (value) => toNullableString(value),
    categoria: (value) => toNullableString(value),
    local_encontrado: (value) => toNullableString(value),
    data_achado: (value) => value || null,
    status: (value) => value,
    imagem_url: (value) => toNullableString(value),
    cadastrado_por_id: (value) => toNullableInteger(value, "cadastrado_por_id"),
    entregue_por_id: (value) => toNullableInteger(value, "entregue_por_id"),
    quem_retirou_nome: (value) => toNullableString(value),
    quem_retirou_documento: (value) => toNullableString(value),
    motivo_devolucao: (value) => toNullableString(value),
    data_entrega: (value) => value || null,
    motivo_estorno: (value) => toNullableString(value)
  };

  Object.keys(allowedFields).forEach((field) => {
    if (field === "imagem_url" && uploadedImageUrl) {
      return;
    }

    if (payload[field] !== undefined) {
      values.push(allowedFields[field](payload[field]));
      fields.push(`${field} = $${values.length}`);
    }
  });

  if (uploadedImageUrl) {
    const currentItem = await pool.query(
      "SELECT imagem_url FROM itens WHERE id = $1",
      [Number(id)]
    );

    if (!currentItem.rowCount) {
      await removeLocalUpload(uploadedImageUrl);
      throw new AppError("Item nao encontrado.", 404);
    }

    previousImageUrl = currentItem.rows[0].imagem_url;
    values.push(uploadedImageUrl);
    fields.push(`imagem_url = $${values.length}`);
  }

  if (!fields.length) {
    throw new AppError("Nenhum campo valido enviado para atualizacao.", 400);
  }

  values.push(Number(id));

  const result = await pool.query(
    `UPDATE itens
     SET ${fields.join(", ")}, atualizado_em = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  if (!result.rowCount) {
    throw new AppError("Item nao encontrado.", 404);
  }

  if (uploadedImageUrl && previousImageUrl && previousImageUrl !== uploadedImageUrl) {
    await removeLocalUpload(previousImageUrl);
  }

  await auditService.logAction({
    usuarioId: user?.id,
    acao: "item_atualizado",
    entidade: "itens",
    entidadeId: result.rows[0].id,
    detalhes: { campos: fields.map((field) => field.split(" = ")[0]), status: result.rows[0].status }
  });

  return result.rows[0];
};

const deleteItem = async (id, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  const result = await pool.query(
    "DELETE FROM itens WHERE id = $1 RETURNING id, imagem_url",
    [Number(id)]
  );

  if (!result.rowCount) {
    throw new AppError("Item nao encontrado.", 404);
  }

  await removeLocalUpload(result.rows[0].imagem_url);

  await auditService.logAction({
    usuarioId: user?.id,
    acao: "item_excluido",
    entidade: "itens",
    entidadeId: Number(id)
  });
};

const requestReturn = async (id, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  const result = await pool.query(
    `UPDATE itens
     SET status = 'aguardando_retirada',
         solicitado_por_id = $2,
         solicitado_em = NOW(),
         atualizado_em = NOW()
     WHERE id = $1 AND status = 'achado'
     RETURNING *`,
    [Number(id), user.id]
  );

  if (!result.rowCount) {
    throw new AppError("Item nao encontrado ou indisponivel para solicitacao.", 400);
  }

  await auditService.logAction({
    usuarioId: user.id,
    acao: "devolucao_solicitada",
    entidade: "itens",
    entidadeId: result.rows[0].id,
    detalhes: { nome_item: result.rows[0].nome_item }
  });

  return result.rows[0];
};

const confirmReceipt = async (id, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  const result = await pool.query(
    `UPDATE itens
     SET status = 'entregue',
         confirmado_por_id = $2,
         confirmado_em = NOW(),
         data_entrega = NOW(),
         quem_retirou_nome = $3,
         quem_retirou_documento = $4,
         atualizado_em = NOW()
     WHERE id = $1 AND status = 'aguardando_retirada' AND solicitado_por_id = $2
     RETURNING *`,
    [Number(id), user.id, user.nome || "Usuario confirmado", user.email || null]
  );

  if (!result.rowCount) {
    throw new AppError("Item nao encontrado ou indisponivel para confirmacao deste usuario.", 400);
  }

  await auditService.logAction({
    usuarioId: user.id,
    acao: "recebimento_confirmado",
    entidade: "itens",
    entidadeId: result.rows[0].id,
    detalhes: { nome_item: result.rows[0].nome_item }
  });

  return result.rows[0];
};

module.exports = {
  listItens,
  listUserRequests,
  createItem,
  updateItem,
  deleteItem,
  requestReturn,
  confirmReceipt
};
