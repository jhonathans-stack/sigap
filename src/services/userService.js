const pool = require("../config/db");
const AppError = require("../utils/AppError");
const { isPositiveInteger } = require("../utils/validators");
const auditService = require("./auditService");

const publicUserFields = `
  id,
  nome,
  email,
  role,
  cpf,
  matricula,
  foto_url,
  criado_em
`;

const listUsers = async () => {
  const result = await pool.query(
    `SELECT ${publicUserFields}
     FROM usuarios
     ORDER BY
       CASE role
         WHEN 'super' THEN 1
         WHEN 'admin' THEN 2
         ELSE 3
       END,
       nome ASC`
  );

  return result.rows;
};

const deleteUser = async (id, requester) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do usuario invalido.", 400);
  }

  const userId = Number(id);

  if (requester.id === userId) {
    throw new AppError("O superusuario logado nao pode excluir a propria conta.", 400);
  }

  const currentUser = await pool.query(
    `SELECT ${publicUserFields}
     FROM usuarios
     WHERE id = $1`,
    [userId]
  );

  if (!currentUser.rowCount) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  const user = currentUser.rows[0];

  if (user.role === "super") {
    throw new AppError("Nao e permitido excluir usuarios super.", 403);
  }

  if (!["user", "admin"].includes(user.role)) {
    throw new AppError("Perfil de usuario invalido para exclusao.", 400);
  }

  await pool.query("DELETE FROM usuarios WHERE id = $1", [userId]);

  await auditService.logAction({
    usuarioId: requester.id,
    acao: "usuario_excluido",
    entidade: "usuarios",
    entidadeId: userId,
    detalhes: { email: user.email, role: user.role }
  });

  return user;
};

const promoteAdminToSuper = async (id, requester) => {
  if (!isPositiveInteger(id)) {
    throw new AppError("ID do usuario invalido.", 400);
  }

  const userId = Number(id);

  if (requester.id === userId) {
    throw new AppError("O superusuario logado ja possui acesso super.", 400);
  }

  const result = await pool.query(
    `UPDATE usuarios
     SET role = 'super'
     WHERE id = $1 AND role = 'admin'
     RETURNING ${publicUserFields}`,
    [userId]
  );

  if (!result.rowCount) {
    throw new AppError("Somente administradores podem receber acesso superusuario por esta acao.", 400);
  }

  await auditService.logAction({
    usuarioId: requester.id,
    acao: "admin_promovido_para_super",
    entidade: "usuarios",
    entidadeId: userId,
    detalhes: {
      promovido_email: result.rows[0].email,
      promovido_nome: result.rows[0].nome,
      promovido_id: result.rows[0].id,
      operador_email: requester.email,
      operador_nome: requester.nome,
      operador_id: requester.id
    }
  });

  return result.rows[0];
};

module.exports = {
  listUsers,
  deleteUser,
  promoteAdminToSuper
};
