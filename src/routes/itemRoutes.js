const express = require("express");
const itemController = require("../controllers/itemController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.get("/", authMiddleware.optional, itemController.listItens);
router.get("/minhas-solicitacoes", authMiddleware, itemController.listUserRequests);
router.get("/para-coleta", authMiddleware, requireRoles("admin", "super"), itemController.listItemsForCollection);
router.get("/entregues", authMiddleware, requireRoles("admin", "super"), itemController.listDeliveredReports);
router.post("/", authMiddleware, requireRoles("admin", "super"), upload.fields([{ name: "imagem", maxCount: 1 }, { name: "imagens", maxCount: 5 }]), itemController.createItem);
router.post("/:id/solicitar-devolucao", authMiddleware, itemController.requestReturn);
router.post("/:id/confirmar-coleta", authMiddleware, requireRoles("admin", "super"), itemController.confirmReceipt);
router.post("/:id/confirmar-recebimento", authMiddleware, requireRoles("admin", "super"), itemController.confirmReceipt);
router.put("/:id", authMiddleware, requireRoles("admin", "super"), upload.fields([{ name: "imagem", maxCount: 1 }, { name: "imagens", maxCount: 5 }]), itemController.updateItem);
router.delete("/:id", authMiddleware, requireRoles("admin", "super"), itemController.deleteItem);

module.exports = router;
