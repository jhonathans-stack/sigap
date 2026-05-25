const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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

const normalizeImageUrls = (urls = [], fallbackUrl = null) => {
  const list = Array.isArray(urls) ? urls : [urls];
  const normalized = list
    .concat(fallbackUrl ? [fallbackUrl] : [])
    .map((url) => toNullableString(url))
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

const removeLocalUploads = async (urls = []) => {
  await Promise.all(normalizeImageUrls(urls).map((url) => removeLocalUpload(url)));
};

const generateCollectionCode = () => {
  return String(crypto.randomInt(100000, 1000000));
};

const validateTurno = (turno) => {
  if (turno === undefined || turno === null || turno === "") {
    return null;
  }

  const value = String(turno).trim();
  if (!["manha", "tarde", "noite"].includes(value)) {
    throw new AppError("Turno deve ser manhã, tarde ou noite.", 400);
  }

  return value;
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
    throw new AppError("Status deve ser achado, perdido, aguardando coleta ou devolvido.", 400);
  }

  if (partial && payload.status !== undefined) {
    throw new AppError("O status não pode ser alterado pela edição do item.", 400);
  }

  if (payload.status === "devolvido" || payload.status === "aguardando_coleta") {
    throw new AppError("Use o fluxo de coleta com código único para alterar este status.", 400);
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

  if (payload.turno !== undefined) {
    validateTurno(payload.turno);
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
    const statusAliases = {
      aguardando_retirada: "aguardando_coleta",
      entregue: "devolvido"
    };
    const normalizedStatus = statusAliases[String(filters.status).trim()] || String(filters.status).trim();

    if (!isAllowedStatus(normalizedStatus)) {
      throw new AppError("Status deve ser achado, perdido, aguardando coleta ou devolvido.", 400);
    }

    values.push(normalizedStatus);
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
     WHERE solicitado_por_id = $1
        OR confirmado_por_id = $1
        OR (cadastrado_por_id = $1 AND status IN ('perdido', 'devolvido'))
     ORDER BY atualizado_em DESC, criado_em DESC, id DESC`,
    [user.id]
  );

  return result.rows;
};

const createItem = async (payload, uploadedImageUrls, user) => {
  validateItemPayload(payload);

  const status = String(payload.status || "achado").trim();
  const imageUrls = normalizeImageUrls(uploadedImageUrls, payload.imagem_url);
  const primaryImageUrl = imageUrls[0] || null;

  const result = await pool.query(
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
       cadastrado_por_id,
       entregue_por_id,
       quem_retirou_nome,
       quem_retirou_documento,
       motivo_devolucao,
       data_entrega,
       motivo_estorno
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      toNullableString(payload.nome_item),
      toNullableString(payload.descricao),
      toNullableString(payload.categoria),
      toNullableString(payload.local_encontrado),
      payload.data_achado || null,
      validateTurno(payload.turno),
      status,
      primaryImageUrl,
      imageUrls,
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

const updateItem = async (id, payload, uploadedImageUrls, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  validateItemPayload(payload, true);

  const fields = [];
  const values = [];
  let previousImageUrls = [];
  const allowedFields = {
    nome_item: (value) => toNullableString(value),
    descricao: (value) => toNullableString(value),
    categoria: (value) => toNullableString(value),
    local_encontrado: (value) => toNullableString(value),
    data_achado: (value) => value || null,
    turno: (value) => validateTurno(value),
    cadastrado_por_id: (value) => toNullableInteger(value, "cadastrado_por_id"),
    entregue_por_id: (value) => toNullableInteger(value, "entregue_por_id"),
    quem_retirou_nome: (value) => toNullableString(value),
    quem_retirou_documento: (value) => toNullableString(value),
    motivo_devolucao: (value) => toNullableString(value),
    data_entrega: (value) => value || null,
    motivo_estorno: (value) => toNullableString(value)
  };

  Object.keys(allowedFields).forEach((field) => {
    if (payload[field] !== undefined) {
      values.push(allowedFields[field](payload[field]));
      fields.push(`${field} = $${values.length}`);
    }
  });

  const imageUrls = normalizeImageUrls(uploadedImageUrls);
  if (imageUrls.length) {
    const currentItem = await pool.query(
      "SELECT imagem_url, imagens_urls FROM itens WHERE id = $1",
      [Number(id)]
    );

    if (!currentItem.rowCount) {
      await removeLocalUploads(imageUrls);
      throw new AppError("Item nao encontrado.", 404);
    }

    previousImageUrls = normalizeImageUrls(currentItem.rows[0].imagens_urls, currentItem.rows[0].imagem_url);
    values.push(imageUrls[0]);
    fields.push(`imagem_url = $${values.length}`);
    values.push(imageUrls);
    fields.push(`imagens_urls = $${values.length}`);
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

  if (imageUrls.length) {
    const urlsToRemove = previousImageUrls.filter((url) => !imageUrls.includes(url));
    await removeLocalUploads(urlsToRemove);
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
    "DELETE FROM itens WHERE id = $1 RETURNING id, imagem_url, imagens_urls",
    [Number(id)]
  );

  if (!result.rowCount) {
    throw new AppError("Item nao encontrado.", 404);
  }

  await removeLocalUploads(normalizeImageUrls(result.rows[0].imagens_urls, result.rows[0].imagem_url));

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

  const code = generateCollectionCode();
  const codeHash = await bcrypt.hash(code, 10);

  const result = await pool.query(
    `UPDATE itens
     SET status = 'aguardando_coleta',
         solicitado_por_id = $2,
         solicitado_em = NOW(),
         codigo_coleta_hash = $3,
         codigo_coleta_criado_em = NOW(),
         atualizado_em = NOW()
     WHERE id = $1 AND status = 'achado'
     RETURNING *`,
    [Number(id), user.id, codeHash]
  );

  if (!result.rowCount) {
    throw new AppError("Item não encontrado ou indisponível para coleta.", 400);
  }

  await auditService.logAction({
    usuarioId: user.id,
    acao: "codigo_coleta_gerado",
    entidade: "itens",
    entidadeId: result.rows[0].id,
    detalhes: { nome_item: result.rows[0].nome_item, status: result.rows[0].status }
  });

  return {
    item: result.rows[0],
    codigo_coleta: code
  };
};

const listItemsForCollection = async () => {
  const result = await pool.query(
    `SELECT i.*,
            u.nome AS solicitante_nome,
            u.email AS solicitante_email,
            u.cpf AS solicitante_cpf,
            u.matricula AS solicitante_matricula
     FROM itens i
     LEFT JOIN usuarios u ON u.id = i.solicitado_por_id
     WHERE i.status = 'aguardando_coleta'
     ORDER BY i.solicitado_em ASC NULLS LAST, i.atualizado_em ASC, i.id ASC`
  );

  return result.rows;
};

const confirmReceipt = async (id, payload, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  const code = String(payload.codigo || payload.codigo_coleta || "").trim();
  const collectorName = toNullableString(payload.coletor_nome);
  const collectorDocument = toNullableString(payload.coletor_documento);

  if (!/^\d{6}$/.test(code)) {
    throw new AppError("Código de coleta inválido.", 400);
  }

  if (!collectorName || collectorName.length < 3) {
    throw new AppError("Nome de quem retirou é obrigatório.", 400);
  }

  if (!collectorDocument || collectorDocument.length < 3) {
    throw new AppError("Documento de quem retirou é obrigatório.", 400);
  }

  const current = await pool.query(
    `SELECT i.*,
            u.nome AS solicitante_nome,
            u.email AS solicitante_email,
            u.cpf AS solicitante_cpf,
            u.matricula AS solicitante_matricula
     FROM itens i
     LEFT JOIN usuarios u ON u.id = i.solicitado_por_id
     WHERE i.id = $1 AND i.status = 'aguardando_coleta'`,
    [Number(id)]
  );

  if (!current.rowCount) {
    throw new AppError("Item não encontrado ou indisponível para coleta.", 400);
  }

  const item = current.rows[0];
  if (!item.codigo_coleta_hash) {
    throw new AppError("Este item não possui código de coleta ativo.", 400);
  }

  const matches = await bcrypt.compare(code, item.codigo_coleta_hash);
  if (!matches) {
    throw new AppError("Código de coleta incorreto.", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await client.query(
      `UPDATE itens
       SET status = 'devolvido',
           entregue_por_id = $2,
           confirmado_por_id = solicitado_por_id,
           confirmado_em = NOW(),
           data_entrega = NOW(),
           quem_retirou_nome = $3,
           quem_retirou_documento = $4,
           codigo_coleta_hash = NULL,
           atualizado_em = NOW()
       WHERE id = $1 AND status = 'aguardando_coleta'
       RETURNING *`,
      [Number(id), user.id, collectorName, collectorDocument]
    );

    if (!updated.rowCount) {
      throw new AppError("Item não encontrado ou já processado.", 400);
    }

    await client.query(
      `INSERT INTO entregas_itens (
         item_id,
         usuario_solicitante_id,
         entregue_por_id,
         coletor_nome,
         coletor_documento,
         coletor_email,
         detalhes_item
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        Number(id),
        item.solicitado_por_id,
        user.id,
        collectorName,
        collectorDocument,
        item.solicitante_email || null,
        JSON.stringify({
          id: item.id,
          nome_item: item.nome_item,
          descricao: item.descricao,
          categoria: item.categoria,
          local_encontrado: item.local_encontrado,
          data_achado: item.data_achado,
          turno: item.turno,
          status_anterior: item.status,
          solicitante_nome: item.solicitante_nome,
          solicitante_email: item.solicitante_email,
          solicitante_cpf: item.solicitante_cpf,
          solicitante_matricula: item.solicitante_matricula,
          entregue_por_nome: user.nome,
          entregue_por_email: user.email
        })
      ]
    );

    await client.query("COMMIT");

    await auditService.logAction({
      usuarioId: user.id,
      acao: "item_devolvido_por_codigo",
      entidade: "itens",
      entidadeId: updated.rows[0].id,
      detalhes: {
        nome_item: updated.rows[0].nome_item,
        coletor_nome: collectorName,
        entregue_por: user.email
      }
    });

    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listDeliveredReports = async (filters = {}) => {
  const values = [];
  const conditions = [];

  if (filters.busca) {
    values.push(`%${normalizeTextSearch(filters.busca)}%`);
    conditions.push(`(
      ${normalizeSqlExpression("i.nome_item")} LIKE $${values.length}
      OR ${normalizeSqlExpression("i.categoria")} LIKE $${values.length}
      OR ${normalizeSqlExpression("i.local_encontrado")} LIKE $${values.length}
      OR ${normalizeSqlExpression("e.coletor_nome")} LIKE $${values.length}
      OR ${normalizeSqlExpression("e.coletor_documento")} LIKE $${values.length}
      OR ${normalizeSqlExpression("solicitante.nome")} LIKE $${values.length}
      OR ${normalizeSqlExpression("entregador.nome")} LIKE $${values.length}
    )`);
  }

  if (filters.categoria) {
    values.push(`%${normalizeTextSearch(filters.categoria)}%`);
    conditions.push(`${normalizeSqlExpression("i.categoria")} LIKE $${values.length}`);
  }

  if (filters.local) {
    values.push(`%${normalizeTextSearch(filters.local)}%`);
    conditions.push(`${normalizeSqlExpression("i.local_encontrado")} LIKE $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT e.*,
            i.nome_item,
            i.descricao,
            i.categoria,
            i.local_encontrado,
            i.data_achado,
            i.turno,
            i.imagem_url,
            i.imagens_urls,
            solicitante.nome AS solicitante_nome,
            solicitante.email AS solicitante_email,
            solicitante.cpf AS solicitante_cpf,
            solicitante.matricula AS solicitante_matricula,
            entregador.nome AS entregue_por_nome,
            entregador.email AS entregue_por_email
     FROM entregas_itens e
     LEFT JOIN itens i ON i.id = e.item_id
     LEFT JOIN usuarios solicitante ON solicitante.id = e.usuario_solicitante_id
     LEFT JOIN usuarios entregador ON entregador.id = e.entregue_por_id
     ${whereClause}
     ORDER BY e.criado_em DESC, e.id DESC
     LIMIT 200`,
    values
  );

  return result.rows;
};

const confirmUserReceipt = async () => {
  throw new AppError("A confirmação de recebimento foi substituída pelo fluxo de coleta com código único.", 410);
};

const markLostItemFoundByOwner = async (itemId, user) => {
  if (!isPositiveInteger(itemId)) {
    throw new AppError("ID do item inválido.", 400);
  }

  const result = await pool.query(
    `UPDATE itens
     SET status = 'devolvido',
         confirmado_por_id = $2,
         confirmado_em = NOW(),
         data_entrega = NOW(),
         atualizado_em = NOW()
     WHERE id = $1
       AND cadastrado_por_id = $2
       AND status = 'perdido'
     RETURNING *`,
    [Number(itemId), user.id]
  );

  if (!result.rowCount) {
    throw new AppError("Item perdido não encontrado ou indisponível para este usuário.", 400);
  }

  await auditService.logAction({
    usuarioId: user.id,
    acao: "item_perdido_encontrado_pelo_usuario",
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
  listItemsForCollection,
  confirmReceipt,
  listDeliveredReports,
  confirmUserReceipt,
  markLostItemFoundByOwner
};
