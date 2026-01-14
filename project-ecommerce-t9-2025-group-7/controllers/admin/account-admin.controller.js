const AccountAdmin = require("../../models/account-admin.model");
const Role = require("../../models/role.model");
const bcrypt = require("bcrypt");

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({
      deleted: false,
      status: "active",
    }).select("name description");

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách nhóm quyền thất bại",
      error: error.message,
    });
  }
};

const index = async (req, res) => {
  try {
    const accounts = await AccountAdmin.find({
      deleted: false,
    })
      .select("-password -token")
      .populate("role");

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách tài khoản quản trị thất bại",
      error: error.message,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { fullname, username, email, phone, password, role, status } = req.body;

    if (!username || !email || !password) {
      return res.json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }

    const existingAccount = await AccountAdmin.findOne({
      $or: [{ username }, { email }],
      deleted: false,
    });

    if (existingAccount) {
      return res.json({
        success: false,
        message: "Username hoặc email đã tồn tại",
      });
    }

    if (role) {
      const roleExists = await Role.findOne({
        _id: role,
        deleted: false,
        status: "active",
      });

      if (!roleExists) {
        return res.json({
          success: false,
          message: "Nhóm quyền không tồn tại",
        });
      }
    }

    const newAccount = new AccountAdmin({
      fullname,
      username,
      email,
      phone,
      password,
      role: role || null,
      status: status || "active",
    });

    await newAccount.save();

    const accountData = await AccountAdmin.findById(newAccount._id)
      .select("-password -token")
      .populate("role");

    res.json({
      success: true,
      message: "Thêm tài khoản quản trị thành công",
      data: accountData,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Thêm tài khoản quản trị thất bại",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    }).populate("role");

    if (!account) {
      return res.json({
        success: false,
        message: "Tài khoản quản trị không tồn tại",
      });
    }

    const accountData = account.toObject();
    delete accountData.password;
    delete accountData.token;

    res.json({
      success: true,
      message: "Lấy dữ liệu tài khoản thành công",
      data: accountData,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy dữ liệu tài khoản thất bại",
      error: error.message,
    });
  }
};

const updatePatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, username, email, phone, password, role, status } = req.body;

    const account = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });

    if (!account) {
      return res.json({
        success: false,
        message: "Tài khoản quản trị không tồn tại",
      });
    }

    if (username || email) {
      const orConditions = [];
      if (username) orConditions.push({ username });
      if (email) orConditions.push({ email });

      const existingAccount = await AccountAdmin.findOne({
        $or: orConditions,
        _id: { $ne: id },
        deleted: false,
      });

      if (existingAccount) {
        return res.json({
          success: false,
          message: "Username hoặc email đã tồn tại",
        });
      }
    }

    if (role !== undefined && role !== null) {
      const roleExists = await Role.findOne({
        _id: role,
        deleted: false,
        status: "active",
      });

      if (!roleExists) {
        return res.json({
          success: false,
          message: "Nhóm quyền không tồn tại",
        });
      }
    }

    const updateData = {};
    if (fullname !== undefined) updateData.fullname = fullname;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await AccountAdmin.updateOne({ _id: id }, updateData);

    const updatedAccount = await AccountAdmin.findById(id)
      .select("-password -token")
      .populate("role");

    res.json({
      success: true,
      message: "Cập nhật tài khoản quản trị thành công",
      data: updatedAccount,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật tài khoản quản trị thất bại",
      error: error.message,
    });
  }
};

const deletePatch = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });

    if (!account) {
      return res.json({
        success: false,
        message: "Tài khoản quản trị không tồn tại",
      });
    }

    await AccountAdmin.updateOne({ _id: id }, { deleted: true });

    res.json({
      success: true,
      message: "Xóa tài khoản quản trị thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Xóa tài khoản quản trị thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  getRoles,
  index,
  createPost,
  update,
  updatePatch,
  deletePatch,
};

