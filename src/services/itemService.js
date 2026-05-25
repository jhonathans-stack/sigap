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
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join("");
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

const getBrazilTodayKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
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

  if (payload.data_achado !== undefined && payload.data_achado !== "" && isValidDate(payload.data_achado) && payload.data_achado > getBrazilTodayKey()) {
    throw new AppError("Data do achado nao pode ser futura.", 400);
  }

  if (payload.data_entrega !== undefined && payload.data_entrega !== "" && Number.isNaN(Date.parse(payload.data_entrega))) {
    throw new AppError("Data de entrega invalida.", 400);
  }

  if (payload.turno !== undefined) {
    validateTurno(payload.turno);
  }
};

const attachCollectionView = async (items, user) => {
  if (!items.length) {
    return items;
  }

  const itemIds = items.map((item) => item.id);
  const values = [itemIds];
  let userSelect = "NULL::INTEGER AS minha_coleta_id, NULL::VARCHAR AS minha_coleta_codigo, NULL::VARCHAR AS minha_coleta_status";
  let userJoin = "";

  if (user?.id) {
    values.push(user.id);
    userSelect = "mc.id AS minha_coleta_id, mc.codigo_coleta AS minha_coleta_codigo, mc.status AS minha_coleta_status";
    userJoin = `LEFT JOIN coletas_itens mc
      ON mc.item_id = i.id
     AND mc.usuario_id = $2
     AND mc.status = 'aguardando_coleta'`;
  }
  const groupBy = user?.id ? "i.id, mc.id, mc.codigo_coleta, mc.status" : "i.id";

  const result = await pool.query(
    `SELECT i.id,
            COUNT(c.id)::INTEGER AS coletas_pendentes,
            ${userSelect}
     FROM itens i
     LEFT JOIN coletas_itens c ON c.item_id = i.id AND c.status = 'aguardando_coleta'
     ${userJoin}
     WHERE i.id = ANY($1)
     GROUP BY ${groupBy}`,
    values
  );

  const meta = new Map(result.rows.map((row) => [Number(row.id), row]));

  return items.map((item) => {
    const row = meta.get(Number(item.id)) || {};
    const hasMyCollection = Boolean(row.minha_coleta_id);
    const hasOtherCollection = Number(row.coletas_pendentes || 0) > 0;
    const statusVisual =
      item.status === "devolvido"
        ? "devolvido"
        : hasMyCollection
          ? "aguardando_coleta"
          : hasOtherCollection
            ? "perdido"
            : item.status;

    return {
      ...item,
      status_visual: statusVisual,
      coletas_pendentes: Number(row.coletas_pendentes || 0),
      minha_coleta_id: row.minha_coleta_id || null,
      minha_coleta_codigo: row.minha_coleta_codigo || null,
      minha_coleta_status: row.minha_coleta_status || null
    };
  });
};

const listItens = async (filters, user) => {
  const conditions = [];
  const values = [];
  let statusFilter = null;

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

    statusFilter = normalizedStatus;
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

  const items = await attachCollectionView(result.rows, user);
  return statusFilter ? items.filter((item) => item.status_visual === statusFilter) : items;
};

const listUserRequests = async (user) => {
  const result = await pool.query(
    `SELECT i.*,
            c.id AS minha_coleta_id,
            CASE WHEN c.status = 'aguardando_coleta' THEN c.codigo_coleta ELSE NULL END AS minha_coleta_codigo,
            c.status AS minha_coleta_status,
            CASE
              WHEN i.status = 'devolvido' THEN 'devolvido'
              WHEN c.status = 'aguardando_coleta' THEN 'aguardando_coleta'
              ELSE i.status
            END AS status_visual
     FROM itens i
     LEFT JOIN coletas_itens c ON c.item_id = i.id AND c.usuario_id = $1
     WHERE c.usuario_id = $1
        OR (i.cadastrado_por_id = $1 AND i.status IN ('perdido', 'devolvido'))
     ORDER BY COALESCE(c.criado_em, i.atualizado_em) DESC, i.criado_em DESC, i.id DESC`,
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

  const current = await pool.query(
    `SELECT *
     FROM itens
     WHERE id = $1 AND status IN ('achado', 'perdido')`,
    [Number(id)]
  );

  if (!current.rowCount) {
    throw new AppError("Item não encontrado ou indisponível para coleta.", 400);
  }

  const existing = await pool.query(
    `SELECT *
     FROM coletas_itens
     WHERE item_id = $1 AND usuario_id = $2 AND status = 'aguardando_coleta'
     ORDER BY criado_em DESC
     LIMIT 1`,
    [Number(id), user.id]
  );

  if (existing.rowCount) {
    return {
      item: {
        ...current.rows[0],
        status_visual: "aguardando_coleta",
        minha_coleta_id: existing.rows[0].id,
        minha_coleta_codigo: existing.rows[0].codigo_coleta,
        minha_coleta_status: existing.rows[0].status
      },
      codigo_coleta: existing.rows[0].codigo_coleta
    };
  }

  let code = generateCollectionCode();
  let uniqueCode = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const codeExists = await pool.query(
      "SELECT 1 FROM coletas_itens WHERE codigo_coleta = $1",
      [code]
    );
    if (!codeExists.rowCount) {
      uniqueCode = true;
      break;
    }
    code = generateCollectionCode();
  }

  if (!uniqueCode) {
    throw new AppError("Nao foi possivel gerar um codigo de coleta. Tente novamente.", 500);
  }

  const codeHash = await bcrypt.hash(code, 10);
  const coleta = await pool.query(
    `INSERT INTO coletas_itens (item_id, usuario_id, codigo_coleta, codigo_coleta_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [Number(id), user.id, code, codeHash]
  );

  await auditService.logAction({
    usuarioId: user.id,
    acao: "codigo_coleta_gerado",
    entidade: "itens",
    entidadeId: current.rows[0].id,
    detalhes: {
      nome_item: current.rows[0].nome_item,
      coleta_id: coleta.rows[0].id,
      usuario_id: user.id,
      usuario_nome: user.nome,
      usuario_email: user.email
    }
  });

  return {
    item: {
      ...current.rows[0],
      status_visual: "aguardando_coleta",
      minha_coleta_id: coleta.rows[0].id,
      minha_coleta_codigo: code,
      minha_coleta_status: "aguardando_coleta"
    },
    codigo_coleta: code
  };
};

const listItemsForCollection = async (filters = {}) => {
  const values = [];
  const conditions = ["c.status = 'aguardando_coleta'", "i.status IN ('achado', 'perdido')"];

  if (filters.busca) {
    values.push(`%${normalizeTextSearch(filters.busca)}%`);
    conditions.push(`(
      ${normalizeSqlExpression("i.nome_item")} LIKE $${values.length}
      OR ${normalizeSqlExpression("i.categoria")} LIKE $${values.length}
      OR ${normalizeSqlExpression("i.local_encontrado")} LIKE $${values.length}
      OR ${normalizeSqlExpression("c.codigo_coleta")} LIKE $${values.length}
      OR ${normalizeSqlExpression("u.nome")} LIKE $${values.length}
      OR ${normalizeSqlExpression("u.email")} LIKE $${values.length}
      OR ${normalizeSqlExpression("u.matricula")} LIKE $${values.length}
    )`);
  }

  const result = await pool.query(
    `SELECT i.*,
            c.id AS coleta_id,
            c.criado_em AS coleta_criado_em,
            c.status AS minha_coleta_status,
            u.id AS solicitante_id,
            u.nome AS solicitante_nome,
            u.email AS solicitante_email,
            u.cpf AS solicitante_cpf,
            u.matricula AS solicitante_matricula,
            'aguardando_coleta' AS status_visual
     FROM coletas_itens c
     JOIN itens i ON i.id = c.item_id
     JOIN usuarios u ON u.id = c.usuario_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY c.criado_em ASC, c.id ASC`,
    values
  );

  return result.rows;
};

const confirmReceipt = async (id, payload, user) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do item invalido.", 400);
  }

  const code = String(payload.codigo || payload.codigo_coleta || "").trim().toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    throw new AppError("Código de coleta inválido.", 400);
  }

  const current = await pool.query(
    `SELECT i.*,
            c.id AS coleta_id,
            c.codigo_coleta_hash,
            c.usuario_id AS coleta_usuario_id,
            u.nome AS solicitante_nome,
            u.email AS solicitante_email,
            u.cpf AS solicitante_cpf,
            u.matricula AS solicitante_matricula
     FROM coletas_itens c
     JOIN itens i ON i.id = c.item_id
     JOIN usuarios u ON u.id = c.usuario_id
     WHERE i.id = $1
       AND c.codigo_coleta = $2
       AND c.status = 'aguardando_coleta'
       AND i.status IN ('achado', 'perdido')`,
    [Number(id), code]
  );

  if (!current.rowCount) {
    throw new AppError("Item, código ou solicitação de coleta não encontrados.", 400);
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
           confirmado_por_id = $5,
           confirmado_em = NOW(),
           data_entrega = NOW(),
           quem_retirou_nome = $3,
           quem_retirou_documento = $4,
           codigo_coleta_hash = NULL,
           atualizado_em = NOW()
       WHERE id = $1 AND status IN ('achado', 'perdido')
       RETURNING *`,
      [Number(id), user.id, item.solicitante_nome || "Usuário", item.solicitante_cpf || item.solicitante_matricula || item.solicitante_email || "Não informado", item.coleta_usuario_id]
    );

    if (!updated.rowCount) {
      throw new AppError("Item não encontrado ou já processado.", 400);
    }

    await client.query(
      `UPDATE coletas_itens
       SET status = 'devolvido',
           usado_em = NOW()
       WHERE id = $1`,
      [item.coleta_id]
    );

    await client.query(
      `UPDATE coletas_itens
       SET status = 'cancelado',
           cancelado_em = NOW()
       WHERE item_id = $1
         AND id <> $2
         AND status = 'aguardando_coleta'`,
      [Number(id), item.coleta_id]
    );

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
        item.coleta_usuario_id,
        user.id,
        item.solicitante_nome || "Usuário",
        item.solicitante_cpf || item.solicitante_matricula || item.solicitante_email || "Não informado",
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
        coletor_nome: item.solicitante_nome,
        coletor_email: item.solicitante_email,
        entregue_por_nome: user.nome,
        entregue_por_email: user.email,
        coleta_id: item.coleta_id
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
