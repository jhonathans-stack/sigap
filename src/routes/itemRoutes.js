const express = require("express");
const itemController = require("../controllers/itemController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.get("/", itemController.listItens);
router.post("/", authMiddleware, requireRoles("admin", "super"), upload.single("imagem"), itemController.createItem);
router.put("/:id", authMiddleware, requireRoles("admin", "super"), upload.single("imagem"), itemController.updateItem);
router.delete("/:id", authMiddleware, requireRoles("admin", "super"), itemController.deleteItem);

module.exports = router;
