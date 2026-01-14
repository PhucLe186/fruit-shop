const jwt = require("jsonwebtoken");
const AccountAdmin = require("../../models/account-admin.model");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({
        success: false,
        message: "Vui lòng nhập username và mật khẩu",
      });
    }

    const account = await AccountAdmin.findOne({
      $or: [{ username }, { email: username }],
      deleted: false,
    }).populate("role");

    if (!account) {
      return res.json({
        success: false,
        message: "Tài khoản không tồn tại",
      });
    }

    if (account.status === "inactive") {
      return res.json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Sai mật khẩu",
      });
    }

    const token = jwt.sign(
      { id: account._id },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    account.token = token;
    await account.save();

    const accountData = account.toObject();
    delete accountData.password;

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      data: accountData,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Đăng nhập thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  login,
};

