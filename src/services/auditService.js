const pool = require("../config/db");

const logAction = async ({ usuarioId, acao, entidade, entidadeId, detalhes = {} }) => {
  await pool.query(
    `INSERT INTO auditoria_logs (usuario_id, acao, entidade, entidade_id, detalhes)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuarioId || null, acao, entidade, entidadeId || null, JSON.stringify(detalhes)]
  );
};

const listLogs = async () => {
  const result = await pool.query(
    `SELECT
       a.id,
       a.usuario_id,
       u.nome AS usuario_nome,
       u.email AS usuario_email,
       a.acao,
       a.entidade,
       a.entidade_id,
       a.detalhes,
       a.criado_em
     FROM auditoria_logs a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     ORDER BY a.criado_em DESC
     LIMIT 300`
  );

  return result.rows;
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return `"${String(value).replace(/"/g, '""')}"`;
};

const exportItemsCsv = async () => {
  const result = await pool.query(
    `SELECT
       id,
       nome_item,
       categoria,
       local_encontrado,
       data_achado,
       status,
       criado_em,
       atualizado_em
     FROM itens
     ORDER BY criado_em DESC, id DESC`
  );

  const header = ["id", "nome_item", "categoria", "local_encontrado", "data_achado", "status", "criado_em", "atualizado_em"];
  const rows = result.rows.map((item) => header.map((field) => escapeCsv(item[field])).join(","));

  return [header.join(","), ...rows].join("\n");
};

module.exports = {
  logAction,
  listLogs,
  exportItemsCsv
};
