const express = require("express");
const router = express.Router();
const cartController = require("../../controllers/client/cart.controller");
const { verifyToken } = require("../../middlewares/client/verifyToken.middleware");

router.get("/", verifyToken, cartController.index);

router.post("/create", verifyToken, cartController.createPost);

router.patch("/delete-product", verifyToken, cartController.deleteProduct);

module.exports = router;

