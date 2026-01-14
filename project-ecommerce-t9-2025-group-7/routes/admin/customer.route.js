const express = require("express");
const router = express.Router();
const customerController = require("../../controllers/admin/customer.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");

router.get("/", checkPermission(PERMISSIONS.KHACH_HANG.XEM), customerController.index);

router.post("/create", checkPermission(PERMISSIONS.KHACH_HANG.THEM), customerController.create);

router.patch("/:id/update", checkPermission(PERMISSIONS.KHACH_HANG.SUA), customerController.update);

router.patch("/:id/change-status", checkPermission(PERMISSIONS.KHACH_HANG.SUA), customerController.changeStatus);

router.delete("/:id", checkPermission(PERMISSIONS.KHACH_HANG.XOA), customerController.deleteItem);

module.exports = router;
