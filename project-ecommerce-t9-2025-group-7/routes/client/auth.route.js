const express = require("express");
const router = express.Router();
const authController = require("../../controllers/client/auth.controller");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/verify-token", authController.verifyToken);

module.exports = router;
