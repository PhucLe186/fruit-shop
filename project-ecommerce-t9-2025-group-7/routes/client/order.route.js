const express = require("express");
const router = express.Router();
const order = require("../../controllers/client/order.controller");
const { verifyToken } = require("../../middlewares/client/verifyToken.middleware");

router.post("/create", order.createPost);
router.post("/track/send-otp", order.sendOTP);
router.post("/track", order.trackOrder);
router.get("/", verifyToken, order.getList);
router.get("/:id", verifyToken, order.getDetail);

module.exports = router;