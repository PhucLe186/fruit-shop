const express = require("express");
const router = express.Router();
const role = require("../../controllers/admin/role.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");

router.get("/permissions", role.getPermissions);

router.get("/", role.index);

router.post("/create", checkPermission(PERMISSIONS.NHOM_QUYEN.THEM), role.createPost);

router.get("/:id", checkPermission(PERMISSIONS.NHOM_QUYEN.XEM), role.update);

router.patch("/:id", checkPermission(PERMISSIONS.NHOM_QUYEN.SUA), role.updatePatch);

router.delete("/:id", checkPermission(PERMISSIONS.NHOM_QUYEN.XOA), role.deletePatch);

module.exports = router;

