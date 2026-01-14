const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/promotion.controller");

router.get("/", controller.getActivePromotions);

router.post("/check", controller.checkPromotionCode);

module.exports = router;
