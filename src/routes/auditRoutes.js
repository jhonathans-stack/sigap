const express = require("express");
const auditController = require("../controllers/auditController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.get("/", authMiddleware, requireRoles("admin", "super"), auditController.listLogs);
router.get("/export-itens", authMiddleware, requireRoles("super"), auditController.exportItemsCsv);

module.exports = router;
