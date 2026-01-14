const express = require("express");
const router = express.Router();
const accountAdmin = require("../../controllers/admin/account-admin.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");

router.get("/roles", accountAdmin.getRoles);

router.get("/", checkPermission(PERMISSIONS.TAI_KHOAN_QUAN_TRI.XEM), accountAdmin.index);

router.post("/create", checkPermission(PERMISSIONS.TAI_KHOAN_QUAN_TRI.THEM), accountAdmin.createPost);

router.get("/:id", checkPermission(PERMISSIONS.TAI_KHOAN_QUAN_TRI.XEM), accountAdmin.update);

router.patch("/:id", checkPermission(PERMISSIONS.TAI_KHOAN_QUAN_TRI.SUA), accountAdmin.updatePatch);

router.delete("/:id", checkPermission(PERMISSIONS.TAI_KHOAN_QUAN_TRI.XOA), accountAdmin.deletePatch);

module.exports = router;

