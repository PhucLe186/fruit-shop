const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/admin/order.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");

router.get("/", checkPermission(PERMISSIONS.DON_HANG.XEM), orderController.index);

router.patch("/:id/status-order", checkPermission(PERMISSIONS.DON_HANG.SUA), orderController.updateStatus);

router.patch("/:id/payment-status", checkPermission(PERMISSIONS.DON_HANG.SUA), orderController.updatePaymentStatus);

module.exports = router;

