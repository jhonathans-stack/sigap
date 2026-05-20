const pool = require("../config/db");
const AppError = require("../utils/AppError");
const { removeLocalUpload } = require("../utils/fileStorage");
const { isAllowedStatus, isPositiveInteger, isValidDate } = require("../utils/validators");

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

const validateItemPayload = (payload, partial = false) => {
  if (!partial || payload.nome_item !== undefined) {
    const nome = toNullableString(payload.nome_item);
    if (!nome || nome.length < 2) {
      throw new AppError("Nome do item deve ter pelo menos 2 caracteres.", 400);
    }
  }

  if (payload.status !== undefined && !isAllowedStatus(payload.status)) {
    throw new AppError("Status deve ser achado ou entregue.", 400);
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
    values.push(String(filters.categoria).trim());
    conditions.push(`LOWER(categoria) = LOWER($${values.length})`);
  }

  if (filters.status) {
    if (!isAllowedStatus(filters.status)) {
      throw new AppError("Status deve ser achado ou entregue.", 400);
    }

    values.push(String(filters.status).trim());
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT *
     FROM itens
     ${whereClause}
     ORDER BY criado_em DESC, id DESC`,
    values
  );

  return result.rows;
};

const createItem = async (payload, uploadedImageUrl) => {
  validateItemPayload(payload);

  const status = String(payload.status || "achado").trim();
  const dataEntrega = payload.data_entrega || (status === "entregue" ? new Date().toISOString() : null);

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
      toNullableInteger(payload.cadastrado_por_id, "cadastrado_por_id"),
      toNullableInteger(payload.entregue_por_id, "entregue_por_id"),
      toNullableString(payload.quem_retirou_nome),
      toNullableString(payload.quem_retirou_documento),
      toNullableString(payload.motivo_devolucao),
      dataEntrega,
      toNullableString(payload.motivo_estorno)
    ]
  );

  return result.rows[0];
};

const updateItem = async (id, payload, uploadedImageUrl) => {
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

  if (payload.status === "entregue" && payload.data_entrega === undefined) {
    values.push(new Date().toISOString());
    fields.push(`data_entrega = $${values.length}`);
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

  return result.rows[0];
};

const deleteItem = async (id) => {
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
};

module.exports = {
  listItens,
  createItem,
  updateItem,
  deleteItem
};
