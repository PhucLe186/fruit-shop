const express = require("express");
const router = express.Router();
const vnpayController = require("../../controllers/client/vnpay.controller");

router.post("/vnpay/create-payment-url", vnpayController.createPaymentUrl);

router.get("/vnpay-ipn", vnpayController.vnpayIpn);

router.get("/vnpay-return", vnpayController.vnpayReturn);

module.exports = router;

