const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
const { requireRoles } = authMiddleware;

router.get("/", authMiddleware, requireRoles("admin", "super"), userController.listUsers);
router.post("/admins", authMiddleware, requireRoles("super"), userController.createAdmin);
router.delete("/:id", authMiddleware, requireRoles("super"), userController.deleteUser);

module.exports = router;
