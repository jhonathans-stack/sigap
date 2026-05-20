const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const AppError = require("../utils/AppError");
const { isValidEmail, isAllowedRole } = require("../utils/validators");

const SALT_ROUNDS = 10;

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

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeCpf = (cpf) => String(cpf || "").replace(/\D/g, "");
const normalizeText = (value) => String(value || "").trim();

const validateUserPayload = ({ nome, email, senha, role, cpf, matricula }, partial = false) => {
  if (!partial || nome !== undefined) {
    if (!nome || String(nome).trim().length < 3) {
      throw new AppError("Nome deve ter pelo menos 3 caracteres.", 400);
    }
  }

  if (!partial || email !== undefined) {
    if (!isValidEmail(email)) {
      throw new AppError("Email invalido.", 400);
    }
  }

  if (!partial || senha !== undefined) {
    if (!senha || String(senha).length < 6) {
      throw new AppError("Senha deve ter pelo menos 6 caracteres.", 400);
    }
  }

  if (role !== undefined && !isAllowedRole(role)) {
    throw new AppError("Role deve ser user, admin ou super.", 400);
  }

  if (!partial || cpf !== undefined) {
    if (normalizeCpf(cpf).length !== 11) {
      throw new AppError("CPF e obrigatorio e deve conter 11 digitos.", 400);
    }
  }

  if (!partial || matricula !== undefined) {
    if (!matricula || normalizeText(matricula).length < 3) {
      throw new AppError("Matricula e obrigatoria.", 400);
    }
  }
};

const createUser = async (payload, role = "user") => {
  validateUserPayload({ ...payload, role });

  if (!["user", "admin"].includes(role)) {
    throw new AppError("Perfil nao permitido para cadastro.", 400);
  }

  const nome = String(payload.nome).trim();
  const email = normalizeEmail(payload.email);
  const senhaHash = await bcrypt.hash(String(payload.senha), SALT_ROUNDS);
  const cpf = normalizeCpf(payload.cpf);
  const matricula = normalizeText(payload.matricula);
  const fotoUrl = payload.foto_url || null;

  const result = await pool.query(
    `INSERT INTO usuarios (nome, email, senha, role, cpf, matricula, foto_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${publicUserFields}`,
    [nome, email, senhaHash, role, cpf, matricula, fotoUrl]
  );

  return result.rows[0];
};

const registerUser = async (payload) => createUser(payload, "user");

const registerAdmin = async (payload) => createUser(payload, "admin");

const loginUser = async (email, senha) => {
  if (!isValidEmail(email) || !senha) {
    throw new AppError("Email e senha sao obrigatorios.", 400);
  }

  const result = await pool.query(
    "SELECT * FROM usuarios WHERE email = $1",
    [normalizeEmail(email)]
  );

  const user = result.rows[0];
  if (!user) {
    throw new AppError("Credenciais invalidas.", 401);
  }

  const passwordMatches = await bcrypt.compare(String(senha), user.senha);
  if (!passwordMatches) {
    throw new AppError("Credenciais invalidas.", 401);
  }

  delete user.senha;
  return user;
};

const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT ${publicUserFields}
     FROM usuarios
     WHERE id = $1`,
    [id]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError("Usuario nao encontrado.", 404);
  }

  return user;
};

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET nao configurado.", 500);
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
};

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  getUserById,
  generateToken
};
