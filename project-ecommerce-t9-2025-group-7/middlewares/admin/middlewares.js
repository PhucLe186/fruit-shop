const jwt = require("jsonwebtoken");
const AccountAdmin = require("../../models/account-admin.model");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const adminId = req.body?._id || req.headers?.['x-admin-id'] || req.query?._id;
      if (!adminId) {
        return res.json({
          success: false,
          message: "Thiếu thông tin người thực hiện. Vui lòng gửi _id của admin trong request body hoặc header x-admin-id",
        });
      }

      const admin = await AccountAdmin.findOne({
        _id: adminId,
        deleted: false,
        status: "active"
      }).populate("role");

      if (!admin) {
        return res.json({
          success: false,
          message: "Tài khoản admin không tồn tại hoặc đã bị khóa",
        });
      }

      let hasPermission = false;
      
      if (admin.permission && Array.isArray(admin.permission)) {
        hasPermission = admin.permission.includes(requiredPermission);
      }
      
      if (!hasPermission && admin.role && admin.role.permissions && Array.isArray(admin.role.permissions)) {
        hasPermission = admin.role.permissions.includes(requiredPermission);
      }

      if (!hasPermission) {
        return res.json({
          success: false,
          message: "Bạn không có quyền thực hiện thao tác này",
          permission: false
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.log(error);
      return res.json({
        success: false,
        message: "Lỗi kiểm tra quyền",
        error: error.message,
        permission: false
      });
    }
  };
};

const verifyToken = async (req, res) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      token = req.cookies?.tokenAdmin;
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

    const account = await AccountAdmin.findOne({
      _id: decoded.id,
      deleted: false,
    }).populate("role");

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản quản trị không tồn tại.",
      });
    }

    if (account.status === "inactive") {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị khóa.",
      });
    }

    if (account.token !== token) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn.",
      });
    }

    const accountData = account.toObject();
    delete accountData.password;
    delete accountData.token;

    res.json({
      success: true,
      data: accountData,
    });
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
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực token.",
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
  checkPermission,
};
