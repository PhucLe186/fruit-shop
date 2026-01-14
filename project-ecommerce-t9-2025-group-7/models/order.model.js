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
    email: String,
    phone: String,
    address: String,
    name: String,
    promotion: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
      },
      code: String,
      name: String,
      discount: Number, //số tiền sẽ giảm
    },
    paymentMethod: String,
    paymentStatus: String,
    info_vnpay: {
      vnp_Amount: Number,
      vnp_BankCode: String,
      vnp_BankTranNo: String,
      vnp_CardType: String,
      vnp_OrderInfo: String,
      vnp_PayDate: String,
      vnp_ResponseCode: String,
      vnp_TmnCode: String,
      vnp_TransactionNo: String,
      vnp_TransactionStatus: String,
      vnp_TxnRef: String,
      isSuccess: Boolean,
      message: String,
      isVerified: Boolean,
    },
    total: Number,
    discount: Number,
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    },
  },
  {
    timestamps: true,
    autoCreate: true,
  }
);

const Order = mongoose.model("Order", schema);

module.exports = Order;
