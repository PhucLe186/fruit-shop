const express = require("express");
const router = express.Router();
const authController = require("../../controllers/admin/auth.controller");
const middlewares = require("../../middlewares/admin/middlewares");

router.post("/login", authController.login);

router.post("/verify-token", middlewares.verifyToken);

module.exports = router;

