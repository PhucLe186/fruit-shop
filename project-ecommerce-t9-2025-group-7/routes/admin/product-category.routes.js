const express = require("express");
const router = express.Router();
const productCatgory = require("../../controllers/admin/product-category.controller");
const { checkPermission } = require("../../middlewares/admin/middlewares");
const { PERMISSIONS } = require("../../constants/permission");

router.get("/",  productCatgory.index);

router.post("/create", checkPermission(PERMISSIONS.DANH_MUC_SAN_PHAM.THEM), productCatgory.createPost);

router.delete("/:id", checkPermission(PERMISSIONS.DANH_MUC_SAN_PHAM.XOA), productCatgory.deletePatch);

router.get("/:id", checkPermission(PERMISSIONS.DANH_MUC_SAN_PHAM.XEM), productCatgory.update);

router.patch("/:id", checkPermission(PERMISSIONS.DANH_MUC_SAN_PHAM.SUA), productCatgory.updatePatch);

module.exports = router;