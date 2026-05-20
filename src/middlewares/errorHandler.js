const multer = require("multer");

const getPostgresMessage = (error) => {
  if (error.code === "23505") {
    return "Registro duplicado.";
  }

  if (error.code === "23503") {
    return "Registro relacionado nao encontrado.";
  }

  if (error.code === "22P02") {
    return "Valor invalido para o banco de dados.";
  }

  return null;
};

const errorHandler = (error, req, res, next) => {
  const postgresMessage = getPostgresMessage(error);

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ erro: "Imagem deve ter no maximo 5MB." });
  }

  const statusCode = error.statusCode || (postgresMessage ? 400 : 500);
  const message = error.isOperational
    ? error.message
    : postgresMessage || "Erro interno do servidor.";

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({ erro: message });
};

module.exports = errorHandler;
