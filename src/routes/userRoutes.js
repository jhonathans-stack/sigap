const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.get("/", authMiddleware, requireRoles("admin", "super"), userController.listUsers);
router.post("/admins", authMiddleware, requireRoles("super"), userController.createAdmin);
router.patch("/:id/promover-super", authMiddleware, requireRoles("super"), userController.promoteToSuper);
router.delete("/:id", authMiddleware, requireRoles("super"), userController.deleteUser);

module.exports = router;
