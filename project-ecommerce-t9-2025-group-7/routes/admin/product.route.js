const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadMany } = require("../../middlewares/admin/upload.middlewares");
const product = require("../../controllers/admin/product.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");
const upload = multer();

router.get("/", checkPermission(PERMISSIONS.SAN_PHAM.XEM), product.index);

router.post("/create", checkPermission(PERMISSIONS.SAN_PHAM.THEM), upload.array("images"), uploadMany, product.createPost);

router.delete("/:id", checkPermission(PERMISSIONS.SAN_PHAM.XOA), product.deletePatch);

router.get("/:id", checkPermission(PERMISSIONS.SAN_PHAM.XEM), product.update);

router.patch("/:id", checkPermission(PERMISSIONS.SAN_PHAM.SUA), upload.array("images"), uploadMany, product.updatePatch);

module.exports = router;