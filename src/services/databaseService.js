const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

let initializationPromise;

const DEFAULT_SUPER_USER = {
  nome: process.env.SUPER_USER_NAME || "Jhonathan Neves de Sousa",
  matricula: process.env.SUPER_USER_MATRICULA || "20252SI0016",
  cpf: process.env.SUPER_USER_CPF || "20252025016",
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
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE");
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
  await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
  await pool.query("UPDATE usuarios SET cpf = LPAD(id::text, 11, '0') WHERE cpf IS NULL OR TRIM(cpf) = ''");
  await pool.query("UPDATE usuarios SET matricula = CONCAT('DROP-', LPAD(id::text, 6, '0')) WHERE matricula IS NULL OR TRIM(matricula) = ''");

  await runCompatibilityQuery("ALTER TABLE usuarios ALTER COLUMN cpf SET NOT NULL");
  await runCompatibilityQuery("ALTER TABLE usuarios ALTER COLUMN matricula SET NOT NULL");
  await runCompatibilityQuery("ALTER TABLE usuarios ALTER COLUMN consentimento_lgpd DROP NOT NULL");
  await runCompatibilityQuery("ALTER TABLE usuarios DROP COLUMN IF EXISTS campus");

  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS data_achado DATE");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS turno VARCHAR(20)");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS imagens_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS solicitado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS solicitado_em TIMESTAMP WITH TIME ZONE");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS confirmado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP WITH TIME ZONE");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS codigo_coleta_hash TEXT");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS codigo_coleta_criado_em TIMESTAMP WITH TIME ZONE");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
  await pool.query("ALTER TABLE itens ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
  await runCompatibilityQuery("ALTER TABLE itens DROP CONSTRAINT IF EXISTS itens_status_check");
  await pool.query("UPDATE itens SET status = 'achado' WHERE status IN ('aguardando_retirada', 'aguardando_coleta')");
  await pool.query("UPDATE itens SET status = 'devolvido' WHERE status = 'entregue'");
  await pool.query("UPDATE itens SET status = 'achado' WHERE status NOT IN ('achado', 'perdido', 'aguardando_coleta', 'devolvido')");
  await pool.query("UPDATE itens SET imagens_urls = ARRAY[imagem_url] WHERE imagem_url IS NOT NULL AND (imagens_urls IS NULL OR array_length(imagens_urls, 1) IS NULL)");
  await pool.query("ALTER TABLE itens ADD CONSTRAINT itens_status_check CHECK (status IN ('achado', 'perdido', 'aguardando_coleta', 'devolvido'))");
  await pool.query("ALTER TABLE itens ALTER COLUMN status SET DEFAULT 'achado'");

  await pool.query("ALTER TABLE solicitacoes_perdidos ADD COLUMN IF NOT EXISTS item_id INTEGER REFERENCES itens(id) ON DELETE SET NULL");
};

const runRetentionRoutine = async () => {
  await pool.query(
    `UPDATE itens
     SET quem_retirou_nome = 'Anonimizado por politica LGPD',
         quem_retirou_documento = NULL,
         motivo_devolucao = 'Registro antigo anonimizado automaticamente.',
         atualizado_em = NOW()
     WHERE status = 'devolvido'
       AND data_entrega IS NOT NULL
       AND data_entrega < NOW() - INTERVAL '365 days'
       AND (quem_retirou_nome IS DISTINCT FROM 'Anonimizado por politica LGPD'
            OR quem_retirou_documento IS NOT NULL)`
  );
};

const seedDefaultSuperUser = async () => {
  const senhaHash = await bcrypt.hash(DEFAULT_SUPER_USER.senha, 10);

  await pool.query(
    `INSERT INTO usuarios (nome, email, senha, role, cpf, matricula)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       nome = EXCLUDED.nome,
       senha = EXCLUDED.senha,
       role = EXCLUDED.role,
       cpf = EXCLUDED.cpf,
       matricula = EXCLUDED.matricula`,
    [
      DEFAULT_SUPER_USER.nome,
      DEFAULT_SUPER_USER.email,
      senhaHash,
      DEFAULT_SUPER_USER.role,
      DEFAULT_SUPER_USER.cpf,
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
      await runRetentionRoutine();
      console.log("Banco de dados DropZone pronto.");
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
