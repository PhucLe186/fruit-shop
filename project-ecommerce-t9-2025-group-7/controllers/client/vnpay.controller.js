const { VNPay } = require('vnpay');
const Order = require("../../models/order.model");
const { sendPaymentConfirmationEmail } = require("./order.controller");

const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMNCODE || '2QXUI4B4',
  secureSecret: process.env.VNP_HASHSECRET || 'your-secret-key',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
});

const createPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, returnUrl } = req.body;
    
    if (!orderId || !amount) {
      return res.json({
        success: false,
        message: "Thiếu thông tin đơn hàng",
      });
    }
    console.log(req.body);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    if (ipAddr) {
      ipAddr = ipAddr.toString().split(",")[0].trim();
    } else {
      ipAddr = '192.168.1.1';
    }
    console.log(process.env.VNP_RETURN_URL);
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_TxnRef: String(orderId),
      vnp_OrderInfo: orderInfo || `Thanh toán đơn hàng số ${orderId}`,
    });
    console.log(amount);
    res.json({
      success: true,
      paymentUrl: paymentUrl,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Tạo URL thanh toán thất bại",
      error: error.message,
    });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    const verify = vnpay.verifyReturnUrl(req.query);
    console.log(verify);
    
    if (verify.isSuccess) {
      const orderId = req.query.vnp_TxnRef;
      const rspCode = req.query.vnp_ResponseCode;

      const order = await Order.findById(orderId)
        .populate("info_product.product")
        .populate("customer");

      if (order) {
        if (rspCode === "00") {
          order.paymentStatus = "paid";
          order.paymentMethod = "VNPay";
          order.info_vnpay = verify
          await order.save();
          
          const orderWithProducts = await Order.findById(order._id)
            .populate("info_product.product");
          await sendPaymentConfirmationEmail(orderWithProducts);
          
          if (order.customer) {
            return res.redirect(`${process.env.CLIENT_URL}/orders/${order._id}`);
          }
          else return res.redirect(`${process.env.CLIENT_URL}/orders/success?orderId=${order._id}&vnpay=${order.info_vnpay.message}&total=${order.total}&customer=${order.name}&createdAt=${order.createdAt}`);
          // res.json({
          //   success: true,
          //   message: "Thanh toán thành công nhé",
          //   data: order,
          // });
        } else {
          res.json({
            success: false,
            message: "Thanh toán thất bại",
            data: order,
          });
        }
      } else {
        res.json({
          success: false,
          message: "Đơn hàng không tồn tại",
        });
      }
    } else {
      res.json({
        success: false,
        message: verify.message,
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: "Xử lý thanh toán thất bại",
      error: error.message,
    });
  }
};

const vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    let orderId = vnp_Params["vnp_TxnRef"];
    let rspCode = vnp_Params["vnp_ResponseCode"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = vnp_HashSecret;
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    let paymentStatus = "0";
    let checkOrderId = true;
    let checkAmount = true;

    const order = await Order.findById(orderId);
    if (!order) {
      checkOrderId = false;
    } else {
      const vnpAmount = parseInt(vnp_Params["vnp_Amount"]) / 100;
      if (order.total !== vnpAmount) {
        checkAmount = false;
      }
      if (order.paymentStatus === "paid") {
        paymentStatus = "1";
      } else if (order.paymentStatus === "failed") {
        paymentStatus = "2";
      }
    }

    if (secureHash === signed) {
      if (checkOrderId) {
        if (checkAmount) {
          if (paymentStatus == "0") {
            if (rspCode == "00") {
              if (order) {
                order.paymentStatus = "paid";
                order.paymentMethod = "VNPay";
                await order.save();
                
                const orderWithProducts = await Order.findById(order._id)
                  .populate("info_product.product");
                await sendPaymentConfirmationEmail(orderWithProducts);
              }
              res.status(200).json({ RspCode: "00", Message: "Success" });
            } else {
              if (order) {
                order.paymentStatus = "failed";
                await order.save();
              }
              res.status(200).json({ RspCode: "00", Message: "Success" });
            }
          } else {
            res
              .status(200)
              .json({
                RspCode: "02",
                Message: "This order has been updated to the payment status",
              });
          }
        } else {
          res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
        }
      } else {
        res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }
    } else {
      res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }
  } catch (error) {
    res.status(200).json({ RspCode: "99", Message: error.message });
  }
};

module.exports = {
  createPaymentUrl,
  vnpayIpn,
  vnpayReturn,
};
