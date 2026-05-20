const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");

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
  listUsers,
  deleteUser
};
