const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

let initializationPromise;

const DEFAULT_SUPER_USER = {
  nome: process.env.SUPER_USER_NAME || "Jhonathan Neves de Sousa",
  matricula: process.env.SUPER_USER_MATRICULA || "20252SI0016",
  email: process.env.SUPER_USER_EMAIL || "jhonathans@ifma.edu.br",
  senha: process.env.SUPER_USER_PASSWORD || "123456",
  role: "super"
};

const readSchema = () => {
  return fs.readFileSync(path.join(__dirname, "..", "config", "schema.sql"), "utf8");
};

const createTables = async () => {
  await pool.query(readSchema());
};

const runCompatibilityQuery = async (sql) => {
  try {
    await pool.query(sql);
  } catch (error) {
    if (!["42703", "42P01"].includes(error.code)) {
      throw error;
    }
  }
};

const ensureCompatibleColumns = async () => {
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(20)");
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS matricula VARCHAR(50)");
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT");
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()");

  await runCompatibilityQuery("ALTER TABLE usuarios ALTER COLUMN cpf DROP NOT NULL");
  await runCompatibilityQuery("ALTER TABLE usuarios ALTER COLUMN matricula DROP NOT NULL");
  await runCompatibilityQuery("ALTER TABLE usuarios ALTER COLUMN consentimento_lgpd DROP NOT NULL");

  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS data_achado DATE");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
  await pool.query("ALTER TABLE itens ALTER COLUMN status SET DEFAULT 'achado'");
};

const seedDefaultSuperUser = async () => {
  const senhaHash = await bcrypt.hash(DEFAULT_SUPER_USER.senha, 10);

  await pool.query(
    `INSERT INTO usuarios (nome, email, senha, role, matricula)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       nome = EXCLUDED.nome,
       senha = EXCLUDED.senha,
       role = EXCLUDED.role,
       matricula = EXCLUDED.matricula`,
    [
      DEFAULT_SUPER_USER.nome,
      DEFAULT_SUPER_USER.email,
      senhaHash,
      DEFAULT_SUPER_USER.role,
      DEFAULT_SUPER_USER.matricula
    ]
  );
};

const initializeDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nao configurado.");
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await createTables();
      await ensureCompatibleColumns();
      await seedDefaultSuperUser();
      console.log("Banco de dados SIGAP pronto.");
    })().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
};

const ensureDatabaseReady = async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initializeDatabase,
  ensureDatabaseReady
};
