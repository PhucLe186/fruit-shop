const express = require("express");
const router = express.Router();
const productCategory = require("../../controllers/client/product-category.controller");

router.get("/", productCategory.index);

router.get("/:slug", productCategory.detail);

module.exports = router;