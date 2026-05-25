const express = require("express");
const lostItemController = require("../controllers/lostItemController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.post("/matches", authMiddleware, lostItemController.findMatches);
router.post("/", authMiddleware, upload.fields([{ name: "imagem", maxCount: 1 }, { name: "imagens", maxCount: 5 }]), lostItemController.createLostItem);
router.get("/minhas", authMiddleware, lostItemController.listMine);
router.patch("/:id/ja-encontrei", authMiddleware, lostItemController.markAsFoundByOwner);
router.get("/", authMiddleware, requireRoles("admin", "super"), lostItemController.listAll);

module.exports = router;
