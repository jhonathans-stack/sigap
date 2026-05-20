const authService = require("../services/authService");
const auditService = require("../services/auditService");
const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");

const createAdmin = asyncHandler(async (req, res) => {
  const usuario = await authService.registerAdmin(req.body);

  await auditService.logAction({
    usuarioId: req.user.id,
    acao: "administrador_criado",
    entidade: "usuarios",
    entidadeId: usuario.id,
    detalhes: { email: usuario.email }
  });

  res.status(201).json({
    mensagem: "Administrador cadastrado com sucesso.",
    usuario
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const usuarios = await userService.listUsers();
  res.json(usuarios);
});

const deleteUser = asyncHandler(async (req, res) => {
  const usuario = await userService.deleteUser(req.params.id, req.user);

  res.json({
    mensagem: "Usuario excluido com sucesso.",
    usuario
  });
});

const promoteToSuper = asyncHandler(async (req, res) => {
  const usuario = await userService.promoteAdminToSuper(req.params.id, req.user);

  res.json({
    mensagem: "Administrador promovido para superusuario com sucesso.",
    usuario
  });
});

module.exports = {
  createAdmin,
  listUsers,
  deleteUser,
  promoteToSuper
};
