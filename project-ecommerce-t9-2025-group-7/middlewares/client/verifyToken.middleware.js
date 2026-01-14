const jwt = require("jsonwebtoken");
const Customer = require("../../models/customer.model");

const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      token = req.cookies?.tokenUser;
    }

    if (!token) {
      token = req.body?.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không có token xác thực.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key"
    );

    const customer = await Customer.findOne({
      _id: decoded.id,
      deleted: false,
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại.",
      });
    }

    if (customer.status === "inactive") {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị khóa.",
      });
    }

    if (customer.token !== token) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn.",
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn.",
      });
    }
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực token.",
    });
  }
};

module.exports = {
  verifyToken,
};

