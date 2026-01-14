const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/promotion.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");

router.get("/", checkPermission(PERMISSIONS.KHUYEN_MAI.XEM), controller.index);

router.post("/create", checkPermission(PERMISSIONS.KHUYEN_MAI.THEM), controller.create);

router.patch("/:id/update", checkPermission(PERMISSIONS.KHUYEN_MAI.SUA), controller.update);

router.patch("/:id/change-status", checkPermission(PERMISSIONS.KHUYEN_MAI.SUA), controller.changeStatus);

router.delete("/:id", checkPermission(PERMISSIONS.KHUYEN_MAI.XOA), controller.deleteItem);

module.exports = router;
