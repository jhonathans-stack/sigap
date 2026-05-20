const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");

const buildUploadedImageUrl = (file) => {
  if (!file) {
    return undefined;
  }

  return `/uploads/${file.filename}`;
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser({
    ...req.body,
    foto_url: buildUploadedImageUrl(req.file)
  });
  const token = authService.generateToken(user);

  res.status(201).json({
    mensagem: "Usuario cadastrado com sucesso.",
    token,
    usuario: user
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;
  const user = await authService.loginUser(email, senha);
  const token = authService.generateToken(user);

  res.json({
    mensagem: "Login realizado com sucesso.",
    token,
    usuario: user
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);

  res.json({
    usuario: user
  });
});

module.exports = {
  register,
  login,
  me
};
