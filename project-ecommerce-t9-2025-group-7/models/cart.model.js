const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    info_product: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
        discount: Number,
        total: Number,
      },
    ],
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  },
  {
    timestamps: true,
    autoCreate: true,
  }
);

const Cart = mongoose.model("Cart", schema);

module.exports = Cart;
