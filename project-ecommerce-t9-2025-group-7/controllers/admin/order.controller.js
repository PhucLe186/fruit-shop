const Order = require("../../models/order.model");
const { sendOrderStatusUpdateEmail, sendPaymentStatusUpdateEmail } = require("../client/order.controller");

const index = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("info_product.product")
      .populate("customer")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách đơn hàng thất bại",
      error: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.json({
        success: false,
        message: "Vui lòng cung cấp trạng thái",
      });
    }

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("info_product.product")
      .populate("customer");

    if (previousStatus !== status) {
      await sendOrderStatusUpdateEmail(updatedOrder, status);
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updatedOrder,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật trạng thái đơn hàng thất bại",
      error: error.message,
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.json({
        success: false,
        message: "Vui lòng cung cấp trạng thái thanh toán",
      });
    }

    const validPaymentStatuses = ["pending", "paid", "unpaid", "refunded", "failed"];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.json({
        success: false,
        message: "Trạng thái thanh toán không hợp lệ",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("info_product.product")
      .populate("customer");

    if (previousPaymentStatus !== paymentStatus) {
      await sendPaymentStatusUpdateEmail(updatedOrder, paymentStatus);
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thanh toán thành công",
      data: updatedOrder,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật trạng thái thanh toán thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  index,
  updateStatus,
  updatePaymentStatus,
};

