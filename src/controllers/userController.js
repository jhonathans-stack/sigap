const authService = require("../services/authService");
const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");

const createAdmin = asyncHandler(async (req, res) => {
  const usuario = await authService.registerAdmin(req.body);

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

module.exports = {
  createAdmin,
  listUsers,
  deleteUser
};
