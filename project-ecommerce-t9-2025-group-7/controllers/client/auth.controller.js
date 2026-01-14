const jwt = require("jsonwebtoken");
const Customer = require("../../models/customer.model");

const register = async (req, res) => {
  try {
    const { fullname, username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
    }

    const existingUser = await Customer.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Tên người dùng đã tồn tại" });
    }

    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
    }

    const newCustomer = new Customer({
      fullname,
      username,
      email,
      phone,
      password,
    });

    await newCustomer.save();

    const token = jwt.sign(
      { id: newCustomer._id },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    newCustomer.token = token;
    await newCustomer.save();

    res.json({
      success: true,
      message: "Đăng ký thành công!",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ!" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu." });
    }

    const customer = await Customer.findOne({
      email,
      deleted: false,
    });

    if (!customer) {
      return res.status(400).json({ message: "Email không tồn tại." });
    }

    if (customer.status === "inactive") {
      return res.status(400).json({ message: "Tài khoản đã bị khóa." });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu." });
    }

    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    customer.token = token;
    await customer.save();

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: customer._id,
        fullname: customer.fullname,
        username: customer.username,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ!" });
  }
};

const verifyToken = async (req, res) => {
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
      token = req.body?.tokenUser;
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

    res.json({
      success: true,
      user: {
        id: customer._id,
        fullname: customer.fullname,
        username: customer.username,
        email: customer.email,
        phone: customer.phone,
      },
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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực token.",
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
};
