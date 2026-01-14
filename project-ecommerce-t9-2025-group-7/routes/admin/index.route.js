const express = require("express");
const router = express.Router();
const productCategory = require("./product-category.routes");
const product = require("./product.route");
const promotion = require("./promotion.route");
const customerRoutes = require("./customer.route");
const accountAdminRoutes = require("./account-admin.route");
const roleRoutes = require("./role.route");
const authRoutes = require("./auth.route");
const orderRoutes = require("./order.route");

const prefixAdmin = process.env.PREFIX_ADMIN;
const middlewares = require("../../middlewares/middlewares");

// router.use(middlewares.verifyDomain);
router.use("/auth", authRoutes);
router.use("/product/category", productCategory);

router.use("/product", product);
router.use("/promotion", promotion);
router.use("/customer", customerRoutes);
router.use("/account", accountAdminRoutes);
router.use("/role", roleRoutes);
router.use("/order", orderRoutes);

module.exports = router;
