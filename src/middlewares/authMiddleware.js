const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const pool = require("../config/db");

const touchLastSeen = (user) => {
  if (!user?.id) {
    return;
  }

  pool.query("UPDATE usuarios SET last_seen = NOW() WHERE id = $1", [user.id]).catch(() => undefined);
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError("Token nao informado.", 401));
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Token invalido.", 401));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    touchLastSeen(req.user);
    return next();
  } catch (error) {
    return next(new AppError("Token invalido ou expirado.", 401));
  }
};

const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario nao autenticado.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Acesso negado para este perfil.", 403));
    }

    return next();
  };
};

const optional = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    touchLastSeen(req.user);
  } catch {
    req.user = null;
  }

  return next();
};

authMiddleware.requireRoles = requireRoles;
authMiddleware.optional = optional;

module.exports = authMiddleware;
