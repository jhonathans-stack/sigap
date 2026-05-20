const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", upload.single("foto"), authController.register);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
