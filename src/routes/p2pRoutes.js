const express = require("express");
const p2pController = require("../controllers/p2pController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.post("/itens/:id/achei", authMiddleware, p2pController.reportFoundItem);
router.get("/conversas", authMiddleware, p2pController.listConversations);
router.get("/conversas/:id/mensagens", authMiddleware, p2pController.listMessages);
router.post("/conversas/:id/mensagens", authMiddleware, upload.single("imagem"), p2pController.sendMessage);
router.post("/conversas/:id/confirmar-entrega", authMiddleware, p2pController.confirmDelivery);
router.get("/relatorios", authMiddleware, requireRoles("super"), p2pController.listReports);

module.exports = router;
