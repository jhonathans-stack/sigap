require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const auditRoutes = require("./routes/auditRoutes");
const itemRoutes = require("./routes/itemRoutes");
const lostItemRoutes = require("./routes/lostItemRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middlewares/errorHandler");
const sanitizeRequest = require("./middlewares/sanitizeRequest");
const { ensureDatabaseReady } = require("./services/databaseService");
const AppError = require("./utils/AppError");

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({
    mensagem: "SIGAP API online",
    rotas: ["/api/auth/login", "/api/auth/register", "/api/itens", "/api/perdidos", "/api/usuarios", "/api/auditoria"]
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(ensureDatabaseReady);
app.use("/api/auth", authRoutes);
app.use("/api/auditoria", auditRoutes);
app.use("/api/itens", itemRoutes);
app.use("/api/perdidos", lostItemRoutes);
app.use("/api/usuarios", userRoutes);

app.use((req, res, next) => {
  next(new AppError("Rota nao encontrada.", 404));
});

app.use(errorHandler);

module.exports = app;
