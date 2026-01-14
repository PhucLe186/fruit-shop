const express = require("express");
const router = express.Router();
const product = require("./product.route");
const order = require("./order.route");
const auth = require("./auth.route");
const cart = require("./cart.route");
const productCategory = require("./product-category.routes");
const payment = require("./payment.route");
const promotion = require("./promotion.route");

router.use("/product", product);

router.use("/category", productCategory);

router.use("/order", order);

router.use("/auth", auth);

router.use("/cart", cart);

router.use("/payment", payment);

router.use("/promotion", promotion);

module.exports = router;
