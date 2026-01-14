const express = require("express");
const router = express.Router();
const product = require("../../controllers/client/product.controller");

router.get("/", product.index);
router.get("/search", product.search);
router.get("/:slug", product.detail);

module.exports = router;