const Order = require("../../models/order.model");
const Product = require("../../models/product.model");
const Promotion = require("../../models/promotion.model");
const mongoose = require("mongoose");
const Customer = require("../../models/customer.model");
const Cart = require("../../models/cart.model");
const OTP = require("../../models/otp.model");
const nodemailer = require("nodemailer");

const getEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const getEmailSender = () => {
  const emailName = process.env.EMAIL_NAME || "Cửa hàng";
  const emailUser = process.env.EMAIL_USER;
  return `"${emailName}" <${emailUser}>`;
};

const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = getEmailTransporter();
    const productList = order.info_product.map((item, index) => {
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product?.name || 'Sản phẩm'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price?.toLocaleString('vi-VN')} đ</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.total?.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">Đặt hàng thành công!</h2>
        <p>Xin chào <strong>${order.name}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi. Đơn hàng của bạn đã được tiếp nhận thành công.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          <p><strong>Họ tên:</strong> ${order.name}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Số điện thoại:</strong> ${order.phone}</p>
          <p><strong>Địa chỉ:</strong> ${order.address}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Chi tiết sản phẩm</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #007bff; color: white;">
                <th style="padding: 10px; text-align: left;">STT</th>
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: right;">Số lượng</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${productList}
            </tbody>
          </table>
        </div>

        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> ${(order.total + (order.discount || 0)).toLocaleString('vi-VN')} đ</p>
          ${order.discount ? `<p style="margin: 5px 0;"><strong>Giảm giá:</strong> -${order.discount.toLocaleString('vi-VN')} đ</p>` : ''}
          <p style="margin: 5px 0; font-size: 18px; color: #dc3545;"><strong>Thành tiền:</strong> ${order.total.toLocaleString('vi-VN')} đ</p>
        </div>

        <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất. Bạn sẽ nhận được thông báo khi đơn hàng được xác nhận.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await transporter.sendMail({
      from: getEmailSender(),
      to: order.email,
      subject: `Đặt hàng thành công - Mã đơn hàng: ${order._id}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Lỗi gửi email xác nhận đơn hàng:", error);
  }
};

const sendPaymentConfirmationEmail = async (order) => {
  try {
    const transporter = getEmailTransporter();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">Thanh toán thành công!</h2>
        <p>Xin chào <strong>${order.name}</strong>,</p>
        <p>Đơn hàng của bạn đã được thanh toán thành công.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin thanh toán</h3>
          <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod || 'VNPay'}</p>
          <p><strong>Số tiền đã thanh toán:</strong> ${order.total.toLocaleString('vi-VN')} đ</p>
          ${order.info_vnpay?.vnp_TransactionNo ? `<p><strong>Mã giao dịch:</strong> ${order.info_vnpay.vnp_TransactionNo}</p>` : ''}
          ${order.info_vnpay?.vnp_PayDate ? `<p><strong>Thời gian thanh toán:</strong> ${new Date(order.info_vnpay.vnp_PayDate).toLocaleString('vi-VN')}</p>` : ''}
        </div>

        <p>Đơn hàng của bạn đang được xử lý và sẽ được giao đến địa chỉ bạn đã cung cấp.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await transporter.sendMail({
      from: getEmailSender(),
      to: order.email,
      subject: `Thanh toán thành công - Mã đơn hàng: ${order._id}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Lỗi gửi email xác nhận thanh toán:", error);
  }
};

const sendOrderStatusUpdateEmail = async (order, newStatus) => {
  try {
    const transporter = getEmailTransporter();
    
    const statusMap = {
      pending: { label: "Chờ xử lý", color: "#ffc107", message: "Đơn hàng của bạn đang chờ được xử lý." },
      confirmed: { label: "Đã xác nhận", color: "#17a2b8", message: "Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị." },
      shipped: { label: "Đang giao hàng", color: "#007bff", message: "Đơn hàng của bạn đang được vận chuyển đến địa chỉ bạn đã cung cấp." },
      delivered: { label: "Đã giao hàng", color: "#28a745", message: "Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!" },
      cancelled: { label: "Đã hủy", color: "#dc3545", message: "Đơn hàng của bạn đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi." },
    };

    const statusInfo = statusMap[newStatus] || { label: newStatus, color: "#6c757d", message: "Trạng thái đơn hàng của bạn đã được cập nhật." };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${statusInfo.color};">Cập nhật trạng thái đơn hàng</h2>
        <p>Xin chào <strong>${order.name}</strong>,</p>
        <p>Trạng thái đơn hàng của bạn đã được cập nhật.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p><strong>Trạng thái mới:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${statusInfo.label}</span></p>
          <p><strong>Ngày cập nhật:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>

        <p>${statusInfo.message}</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await transporter.sendMail({
      from: getEmailSender(),
      to: order.email,
      subject: `Cập nhật trạng thái đơn hàng - Mã đơn hàng: ${order._id}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Lỗi gửi email cập nhật trạng thái đơn hàng:", error);
  }
};

const sendPaymentStatusUpdateEmail = async (order, newPaymentStatus) => {
  try {
    const transporter = getEmailTransporter();
    
    const paymentStatusMap = {
      pending: { label: "Chờ thanh toán", color: "#ffc107", message: "Đơn hàng của bạn đang chờ thanh toán." },
      paid: { label: "Đã thanh toán", color: "#28a745", message: "Đơn hàng của bạn đã được thanh toán thành công." },
      unpaid: { label: "Chưa thanh toán", color: "#dc3545", message: "Đơn hàng của bạn chưa được thanh toán." },
      refunded: { label: "Đã hoàn tiền", color: "#17a2b8", message: "Đơn hàng của bạn đã được hoàn tiền." },
      failed: { label: "Thanh toán thất bại", color: "#dc3545", message: "Thanh toán đơn hàng của bạn đã thất bại. Vui lòng thử lại hoặc liên hệ với chúng tôi." },
    };

    const statusInfo = paymentStatusMap[newPaymentStatus] || { label: newPaymentStatus, color: "#6c757d", message: "Trạng thái thanh toán đơn hàng của bạn đã được cập nhật." };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${statusInfo.color};">Cập nhật trạng thái thanh toán</h2>
        <p>Xin chào <strong>${order.name}</strong>,</p>
        <p>Trạng thái thanh toán đơn hàng của bạn đã được cập nhật.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thông tin thanh toán</h3>
          <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
          <p><strong>Trạng thái mới:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${statusInfo.label}</span></p>
          <p><strong>Số tiền:</strong> ${order.total.toLocaleString('vi-VN')} đ</p>
          <p><strong>Ngày cập nhật:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>

        <p>${statusInfo.message}</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await transporter.sendMail({
      from: getEmailSender(),
      to: order.email,
      subject: `Cập nhật trạng thái thanh toán - Mã đơn hàng: ${order._id}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Lỗi gửi email cập nhật trạng thái thanh toán:", error);
  }
};

const createPost = async (req, res) => {
  try {
    const { info_product, email, phone, address, name, paymentMethod, paymentStatus, total, discount, status, customer, promotion } = req.body;
    
    if (!info_product || !Array.isArray(info_product) || info_product.length === 0) {
      return res.json({
        success: false,
        message: "Giỏ hàng không được để trống",
      });
    }
    
    if (!email || !phone || !address || !name) {
      return res.json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }
    let total_result = 0
    for (const it of info_product) {
      const product = await Product.findOne({
        _id: it.product,
        deleted: false,
        status: "active",
      });
      if (!product) {
        return res.json({
          success: false,
          message: "Sản phẩm không tồn tại",
        });
      }
      
      const productPrice = product.price || 0;
      const productComparePrice = product.compare_price || productPrice;
      
      if (productPrice !== it.price) {
        return res.json({
          success: false,
          message: "Giá sản phẩm không khớp, vui lòng tải lại trang",
        });
      }
      
      const calculatedDiscount = productComparePrice > productPrice 
        ? ((productComparePrice - productPrice) / productComparePrice) * 100 
        : 0;
      
      if (Math.abs(calculatedDiscount - (it.discount || 0)) > 0.01) {
        return res.json({
          success: false,
          message: "Giảm giá sản phẩm không khớp, vui lòng tải lại trang",
        });
      }
      
      const calculatedTotal = productPrice * it.quantity;
      if (calculatedTotal !== it.total) {
        return res.json({
          success: false,
          message: "Tổng tiền sản phẩm không khớp, vui lòng tải lại trang",
        });
      }
      
      total_result += it.total
    }

    let calculatedDiscount = 0;
    let promotionData = null;

    if (promotion && promotion.id) {
      const promotionDoc = await Promotion.findOne({
        _id: promotion.id,
        deleted: false,
        status: "active",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (!promotionDoc) {
        return res.json({
          success: false,
          message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn",
        });
      }

      if (total_result < promotionDoc.minOrderValue) {
        return res.json({
          success: false,
          message: `Đơn hàng phải từ ${promotionDoc.minOrderValue} trở lên mới được áp dụng mã khuyến mãi`,
        });
      }

      if (promotionDoc.discountType === "percent") {
        calculatedDiscount = Math.round((total_result * promotionDoc.discountValue) / 100);
      } else {
        calculatedDiscount = promotionDoc.discountValue;
      }

      if (calculatedDiscount > total_result) {
        calculatedDiscount = total_result;
      }

      promotionData = {
        id: promotionDoc._id,
        code: promotionDoc.code,
        name: promotionDoc.name,
        discount: calculatedDiscount,
      };
    }

    const calculatedTotal = total_result - calculatedDiscount;

    if (Math.abs(calculatedDiscount - (discount || 0)) > 1) {
      return res.json({
        success: false,
        message: "Số tiền giảm giá không khớp, vui lòng tải lại trang",
      });
    }

    if (Math.abs(calculatedTotal - total) > 1) {
      return res.json({
        success: false,
        message: "Tổng tiền đơn hàng không khớp",
      });
    }

    if(customer){
      const checkCustomer = await Customer.findOne({
        _id: customer,
        deleted: false,
        status: "active",
      });
      if(!checkCustomer){
        return res.json({
          success: false,
          message: "Khách hàng không tồn tại",
        });
      }
      
      for (const it of info_product) {
        await Cart.updateOne(
          { customer: customer },
          { 
            $pull: { 
              info_product: { product: it.product } 
            } 
          }
        );
      }
    }

    const orderData = {
      ...req.body,
      total: calculatedTotal,
      discount: calculatedDiscount,
      promotion: promotionData,
    };

    const newOrder = new Order(orderData);
    await newOrder.save();
    
    const orderWithProducts = await Order.findById(newOrder._id)
      .populate("info_product.product");
    
    await sendOrderConfirmationEmail(orderWithProducts);
    
    res.json({
      success: true,
      message: "Tạo đơn hàng thành công",
      orderId: newOrder._id,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Tạo đơn hàng thất bại",
      error: error.message,
    });
  }
};

const getList = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để xem đơn hàng",
      });
    }

    const { status, paymentStatus, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { customer: customerId };
    
    if (status) {
      query.status = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(query)
      .populate("info_product.product")
      .populate("customer")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách đơn hàng thất bại",
      error: error.message,
    });
  }
};

const getDetail = async (req, res) => {
  try {
    const customerId = req.customer?._id;
    const { id } = req.params;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để xem đơn hàng",
      });
    }

    if (!id) {
      return res.json({
        success: false,
        message: "Thiếu ID đơn hàng",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: customerId,
    })
      .populate("info_product.product")
      .populate("customer")
      .populate("promotion.id");

    if (!order) {
      return res.json({
        success: false,
        message: "Đơn hàng không tồn tại",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy chi tiết đơn hàng thất bại",
      error: error.message,
    });
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: "Thiếu email",
      });
    }

    const order = await Order.findOne({ email });
    if (!order) {
      return res.json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email });
    await OTP.create({ email, code, expiredAt });

    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from: getEmailSender(),
      to: email,
      subject: "Mã OTP tra cứu đơn hàng",
      html: `<p>Mã OTP của bạn là: <strong>${code}</strong></p><p>Mã có hiệu lực trong 5 phút.</p>`,
    });

    res.json({
      success: true,
      message: "Đã gửi mã OTP qua email",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Gửi OTP thất bại",
      error: error.message,
    });
  }
};

const trackOrder = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json({
        success: false,
        message: "Thiếu email hoặc mã OTP",
      });
    }

    const otpRecord = await OTP.findOne({ email, code: otp });
    if (!otpRecord) {
      return res.json({
        success: false,
        message: "Mã OTP không đúng hoặc đã hết hạn",
      });
    }

    const orders = await Order.find({ email })
      .populate("info_product.product")
      .populate("customer")
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const statusMap = {
      pending: { label: "Chờ xử lý", step: 1, description: "Đơn hàng đã được tạo và đang chờ xử lý" },
      confirmed: { label: "Đã xác nhận", step: 2, description: "Đơn hàng đã được xác nhận" },
      shipped: { label: "Đang giao hàng", step: 3, description: "Đơn hàng đang được vận chuyển" },
      delivered: { label: "Đã giao hàng", step: 4, description: "Đơn hàng đã được giao thành công" },
      cancelled: { label: "Đã hủy", step: 0, description: "Đơn hàng đã bị hủy" },
    };

    const paymentStatusMap = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      unpaid: "Chưa thanh toán",
      refunded: "Đã hoàn tiền",
      failed: "Thanh toán thất bại",
    };

    const ordersWithTimeline = orders.map((order) => {
      const currentStatus = order.status || "pending";
      const currentStep = statusMap[currentStatus]?.step || 0;
      const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
      const timeline = [];

      statusOrder.forEach((status, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        const isPending = step > currentStep;

        if (currentStatus === "cancelled" && status !== "pending") {
          return;
        }

        timeline.push({
          status: status,
          statusLabel: statusMap[status].label,
          description: statusMap[status].description,
          step: step,
          isCompleted: isCompleted,
          isActive: isActive,
          isPending: isPending,
          date: isCompleted || isActive ? (status === "pending" ? order.createdAt : order.updatedAt) : null,
        });
      });

      if (order.info_vnpay && order.info_vnpay.isSuccess && order.paymentStatus === "paid") {
        timeline.push({
          type: "payment",
          status: "paid",
          statusLabel: "Thanh toán thành công",
          description: `Thanh toán qua ${order.paymentMethod || "VNPay"}`,
          isCompleted: true,
          isActive: false,
          date: order.info_vnpay.vnp_PayDate ? new Date(order.info_vnpay.vnp_PayDate) : order.updatedAt,
        });
      }

      return {
        _id: order._id,
        status: order.status,
        statusLabel: statusMap[order.status]?.label || order.status,
        paymentStatus: order.paymentStatus,
        paymentStatusLabel: paymentStatusMap[order.paymentStatus] || "Chờ thanh toán",
        paymentMethod: order.paymentMethod,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        info_product: order.info_product,
        timeline: timeline,
        currentStep: currentStep,
        maxStep: 4,
      };
    });

    res.json({
      success: true,
      data: ordersWithTimeline,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Tra cứu đơn hàng thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getList,
  getDetail,
  sendOTP,
  trackOrder,
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentStatusUpdateEmail,
};
