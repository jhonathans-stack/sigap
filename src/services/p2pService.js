const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const AppError = require("../utils/AppError");
const auditService = require("./auditService");

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = () => Array.from({ length: 6 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join("");

const normalizeText = (value) => {
  const text = String(value || "").trim();
  return text.length ? text : null;
};

const buildUserSelect = (prefix) => `
  ${prefix}.id,
  ${prefix}.nome,
  ${prefix}.foto_url,
  ${prefix}.last_seen,
  CASE
    WHEN ${prefix}.last_seen IS NOT NULL AND ${prefix}.last_seen > NOW() - INTERVAL '2 minutes' THEN true
    ELSE false
  END AS online
`;

const assertParticipant = (conversation, user) => {
  if (!conversation || (Number(conversation.dono_id) !== Number(user.id) && Number(conversation.encontrado_por_id) !== Number(user.id))) {
    throw new AppError("Conversa nao encontrada para este usuario.", 404);
  }
};

const createUniqueCode = async () => {
  let code = generateCode();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const exists = await pool.query("SELECT 1 FROM p2p_conversas WHERE codigo_entrega = $1", [code]);
    if (!exists.rowCount) {
      return code;
    }
    code = generateCode();
  }

  throw new AppError("Nao foi possivel gerar codigo de entrega.", 500);
};

const mapConversationRow = (row, userId) => {
  const isOwner = Number(row.dono_id) === Number(userId);
  const otherPrefix = isOwner ? "encontrador" : "dono";

  return {
    id: row.id,
    item_id: row.item_id,
    dono_id: row.dono_id,
    encontrado_por_id: row.encontrado_por_id,
    status: row.status,
    codigo_entrega: isOwner && row.status === "aberta" ? row.codigo_entrega : null,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    entregue_em: row.entregue_em,
    mensagens_nao_lidas: Number(row.mensagens_nao_lidas || 0),
    item: {
      id: row.item_id,
      nome_item: row.nome_item,
      descricao: row.descricao,
      categoria: row.categoria,
      imagem_url: row.imagem_url,
      imagens_urls: row.imagens_urls,
      status: row.item_status
    },
    outro_usuario: {
      id: row[`${otherPrefix}_id`],
      nome: row[`${otherPrefix}_nome`],
      foto_url: row[`${otherPrefix}_foto_url`],
      last_seen: row[`${otherPrefix}_last_seen`],
      online: row[`${otherPrefix}_online`]
    }
  };
};

const conversationSelect = `
  c.*,
  i.nome_item,
  i.descricao,
  i.categoria,
  i.imagem_url,
  i.imagens_urls,
  i.status AS item_status,
  dono.id AS dono_id_view,
  dono.nome AS dono_nome,
  dono.foto_url AS dono_foto_url,
  dono.last_seen AS dono_last_seen,
  CASE WHEN dono.last_seen IS NOT NULL AND dono.last_seen > NOW() - INTERVAL '2 minutes' THEN true ELSE false END AS dono_online,
  encontrador.id AS encontrador_id,
  encontrador.nome AS encontrador_nome,
  encontrador.foto_url AS encontrador_foto_url,
  encontrador.last_seen AS encontrador_last_seen,
  CASE WHEN encontrador.last_seen IS NOT NULL AND encontrador.last_seen > NOW() - INTERVAL '2 minutes' THEN true ELSE false END AS encontrador_online
`;

const getConversationById = async (id) => {
  const result = await pool.query(
    `SELECT ${conversationSelect}
     FROM p2p_conversas c
     JOIN itens i ON i.id = c.item_id
     JOIN usuarios dono ON dono.id = c.dono_id
     JOIN usuarios encontrador ON encontrador.id = c.encontrado_por_id
     WHERE c.id = $1`,
    [Number(id)]
  );

  return result.rows[0] || null;
};

const reportFoundItem = async (itemId, user) => {
  const itemResult = await pool.query(
    `SELECT *
     FROM itens
     WHERE id = $1
       AND status = 'perdido'
       AND cadastrado_por_id IS NOT NULL`,
    [Number(itemId)]
  );

  if (!itemResult.rowCount) {
    throw new AppError("Item perdido nao encontrado ou indisponivel para contato P2P.", 404);
  }

  const item = itemResult.rows[0];
  if (Number(item.cadastrado_por_id) === Number(user.id)) {
    throw new AppError("Voce nao pode abrir um contato P2P para um item cadastrado por voce.", 400);
  }

  const existing = await pool.query(
    `SELECT id
     FROM p2p_conversas
     WHERE item_id = $1
       AND encontrado_por_id = $2
       AND status = 'aberta'
     ORDER BY criado_em DESC
     LIMIT 1`,
    [Number(itemId), user.id]
  );

  if (existing.rowCount) {
    const conversation = await getConversationById(existing.rows[0].id);
    return mapConversationRow({ ...conversation, mensagens_nao_lidas: 0 }, user.id);
  }

  const code = await createUniqueCode();
  const codeHash = await bcrypt.hash(code, 10);
  const result = await pool.query(
    `INSERT INTO p2p_conversas (item_id, dono_id, encontrado_por_id, codigo_entrega, codigo_entrega_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [Number(itemId), item.cadastrado_por_id, user.id, code, codeHash]
  );

  await pool.query(
    `INSERT INTO p2p_mensagens (conversa_id, usuario_id, texto)
     VALUES ($1, $2, $3)`,
    [result.rows[0].id, user.id, "Encontrei este item e abri este chat para combinar a devolucao."]
  );

  await auditService.logAction({
    usuarioId: user.id,
    acao: "contato_p2p_aberto",
    entidade: "p2p_conversas",
    entidadeId: result.rows[0].id,
    detalhes: { item_id: item.id, nome_item: item.nome_item, dono_id: item.cadastrado_por_id }
  });

  const conversation = await getConversationById(result.rows[0].id);
  return mapConversationRow({ ...conversation, mensagens_nao_lidas: 0 }, user.id);
};

const listConversations = async (user) => {
  const result = await pool.query(
    `SELECT ${conversationSelect},
            COUNT(m.id) FILTER (WHERE m.usuario_id IS DISTINCT FROM $1 AND m.lida_em IS NULL)::INTEGER AS mensagens_nao_lidas
     FROM p2p_conversas c
     JOIN itens i ON i.id = c.item_id
     JOIN usuarios dono ON dono.id = c.dono_id
     JOIN usuarios encontrador ON encontrador.id = c.encontrado_por_id
     LEFT JOIN p2p_mensagens m ON m.conversa_id = c.id
     WHERE c.dono_id = $1 OR c.encontrado_por_id = $1
     GROUP BY c.id, i.id, dono.id, encontrador.id
     ORDER BY c.atualizado_em DESC, c.id DESC`,
    [user.id]
  );

  return result.rows.map((row) => mapConversationRow(row, user.id));
};

const listMessages = async (conversationId, user) => {
  const conversation = await getConversationById(conversationId);
  assertParticipant(conversation, user);

  await pool.query(
    `UPDATE p2p_mensagens
     SET lida_em = COALESCE(lida_em, NOW())
     WHERE conversa_id = $1 AND usuario_id IS DISTINCT FROM $2`,
    [Number(conversationId), user.id]
  );

  const result = await pool.query(
    `SELECT m.*,
            u.nome AS usuario_nome,
            u.foto_url AS usuario_foto_url,
            u.last_seen AS usuario_last_seen,
            CASE WHEN u.last_seen IS NOT NULL AND u.last_seen > NOW() - INTERVAL '2 minutes' THEN true ELSE false END AS usuario_online
     FROM p2p_mensagens m
     LEFT JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.conversa_id = $1
     ORDER BY m.criado_em ASC, m.id ASC`,
    [Number(conversationId)]
  );

  return {
    conversa: mapConversationRow({ ...conversation, mensagens_nao_lidas: 0 }, user.id),
    mensagens: result.rows
  };
};

const sendMessage = async (conversationId, payload, imageUrl, user) => {
  const conversation = await getConversationById(conversationId);
  assertParticipant(conversation, user);

  if (conversation.status !== "aberta") {
    throw new AppError("Esta conversa ja foi encerrada.", 400);
  }

  const texto = normalizeText(payload.texto);
  if (!texto && !imageUrl) {
    throw new AppError("Informe uma mensagem ou imagem.", 400);
  }

  const result = await pool.query(
    `INSERT INTO p2p_mensagens (conversa_id, usuario_id, texto, imagem_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [Number(conversationId), user.id, texto, imageUrl || null]
  );

  await pool.query("UPDATE p2p_conversas SET atualizado_em = NOW() WHERE id = $1", [Number(conversationId)]);
  return result.rows[0];
};

const confirmDelivery = async (conversationId, payload, user) => {
  const code = String(payload.codigo || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    throw new AppError("Codigo de entrega invalido.", 400);
  }

  const conversation = await getConversationById(conversationId);
  assertParticipant(conversation, user);

  if (Number(conversation.encontrado_por_id) !== Number(user.id)) {
    throw new AppError("Somente quem encontrou o item pode confirmar a entrega com o codigo.", 403);
  }

  if (conversation.status !== "aberta") {
    throw new AppError("Esta conversa ja foi encerrada.", 400);
  }

  const matches = await bcrypt.compare(code, conversation.codigo_entrega_hash);
  if (!matches) {
    throw new AppError("Codigo de entrega incorreto.", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedItem = await client.query(
      `UPDATE itens
       SET status = 'devolvido',
           confirmado_por_id = $2,
           confirmado_em = NOW(),
           data_entrega = NOW(),
           atualizado_em = NOW(),
           quem_retirou_nome = $3,
           quem_retirou_documento = $4
       WHERE id = $1 AND status = 'perdido'
       RETURNING *`,
      [conversation.item_id, conversation.dono_id, conversation.dono_nome || "Usuario", `P2P-${conversation.id}`]
    );

    if (!updatedItem.rowCount) {
      throw new AppError("Item nao encontrado ou ja finalizado.", 400);
    }

    await client.query(
      `UPDATE p2p_conversas
       SET status = 'devolvida',
           entregue_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $1`,
      [Number(conversationId)]
    );

    const messages = await client.query(
      `SELECT m.id, m.texto, m.imagem_url, m.criado_em, u.nome AS usuario_nome
       FROM p2p_mensagens m
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.conversa_id = $1
       ORDER BY m.criado_em ASC, m.id ASC`,
      [Number(conversationId)]
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
        conversation.item_id,
        conversation.dono_id,
        conversation.encontrado_por_id,
        conversation.dono_nome || "Usuario",
        `P2P-${conversation.id}`,
        null,
        JSON.stringify({
          tipo: "p2p",
          conversa_id: conversation.id,
          item_id: conversation.item_id,
          nome_item: conversation.nome_item,
          dono_nome: conversation.dono_nome,
          encontrador_nome: conversation.encontrador_nome,
          historico: messages.rows
        })
      ]
    );

    await client.query("COMMIT");

    await auditService.logAction({
      usuarioId: user.id,
      acao: "entrega_p2p_confirmada",
      entidade: "p2p_conversas",
      entidadeId: Number(conversationId),
      detalhes: {
        item_id: conversation.item_id,
        nome_item: conversation.nome_item,
        dono_nome: conversation.dono_nome,
        encontrador_nome: conversation.encontrador_nome
      }
    });

    return updatedItem.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listReports = async () => {
  const result = await pool.query(
    `SELECT ${conversationSelect},
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', m.id,
                  'texto', m.texto,
                  'imagem_url', m.imagem_url,
                  'lida_em', m.lida_em,
                  'criado_em', m.criado_em,
                  'usuario_nome', mu.nome
                )
                ORDER BY m.criado_em ASC, m.id ASC
              ) FILTER (WHERE m.id IS NOT NULL),
              '[]'
            ) AS mensagens
     FROM p2p_conversas c
     JOIN itens i ON i.id = c.item_id
     JOIN usuarios dono ON dono.id = c.dono_id
     JOIN usuarios encontrador ON encontrador.id = c.encontrado_por_id
     LEFT JOIN p2p_mensagens m ON m.conversa_id = c.id
     LEFT JOIN usuarios mu ON mu.id = m.usuario_id
     GROUP BY c.id, i.id, dono.id, encontrador.id
     ORDER BY c.atualizado_em DESC, c.id DESC
     LIMIT 200`
  );

  return result.rows;
};

module.exports = {
  reportFoundItem,
  listConversations,
  listMessages,
  sendMessage,
  confirmDelivery,
  listReports
};
