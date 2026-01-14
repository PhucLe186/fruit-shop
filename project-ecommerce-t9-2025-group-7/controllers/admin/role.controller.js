const Role = require("../../models/role.model");
const { PERMISSIONS } = require("../../constants/permission");

const getPermissions = async (req, res) => {
  try {
    const moduleLabels = {
      SAN_PHAM: "Sản phẩm",
      DANH_MUC_SAN_PHAM: "Danh mục sản phẩm",
      KHACH_HANG: "Khách hàng",
      KHUYEN_MAI: "Khuyến mãi",
      TAI_KHOAN_QUAN_TRI: "Tài khoản quản trị",
      DON_HANG: "Đơn hàng",
      BANG_DIEU_KHIEN: "Bảng điều khiển",
    };

    const permissionLabels = {
      XEM: "Xem",
      THEM: "Thêm",
      SUA: "Sửa",
      XOA: "Xóa",
    };

    const permissionsData = Object.keys(PERMISSIONS).map((moduleKey) => {
      const module = PERMISSIONS[moduleKey];
      return {
        module: moduleKey,
        label: moduleLabels[moduleKey] || moduleKey,
        permissions: Object.keys(module).map((key) => ({
          value: module[key],
          label: permissionLabels[key] || key,
        })),
      };
    });

    res.json({
      success: true,
      data: permissionsData,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách quyền thất bại",
      error: error.message,
    });
  }
};

const index = async (req, res) => {
  try {
    const roles = await Role.find({
      deleted: false,
    });

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

const createPost = async (req, res) => {
  try {
    const { name, permissions, description, status } = req.body;

    if (!name) {
      return res.json({
        success: false,
        message: "Vui lòng điền tên nhóm quyền",
      });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.json({
        success: false,
        message: "Vui lòng chọn ít nhất một quyền",
      });
    }

    const existingRole = await Role.findOne({
      name: name,
      deleted: false,
    });

    if (existingRole) {
      return res.json({
        success: false,
        message: "Tên nhóm quyền đã tồn tại",
      });
    }

    const newRole = new Role({
      name,
      permissions,
      description,
      status: status || "active",
    });

    await newRole.save();

    res.json({
      success: true,
      message: "Thêm nhóm quyền thành công",
      data: newRole,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Thêm nhóm quyền thất bại",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (!role) {
      return res.json({
        success: false,
        message: "Nhóm quyền không tồn tại",
      });
    }

    res.json({
      success: true,
      message: "Lấy dữ liệu nhóm quyền thành công",
      data: role,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy dữ liệu nhóm quyền thất bại",
      error: error.message,
    });
  }
};

const updatePatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, description, status } = req.body;

    const role = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (!role) {
      return res.json({
        success: false,
        message: "Nhóm quyền không tồn tại",
      });
    }

    if (name) {
      const existingRole = await Role.findOne({
        name: name,
        _id: { $ne: id },
        deleted: false,
      });

      if (existingRole) {
        return res.json({
          success: false,
          message: "Tên nhóm quyền đã tồn tại",
        });
      }
    }

    if (permissions && (!Array.isArray(permissions) || permissions.length === 0)) {
      return res.json({
        success: false,
        message: "Vui lòng chọn ít nhất một quyền",
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    await Role.updateOne({ _id: id }, updateData);

    const updatedRole = await Role.findById(id);

    res.json({
      success: true,
      message: "Cập nhật nhóm quyền thành công",
      data: updatedRole,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật nhóm quyền thất bại",
      error: error.message,
    });
  }
};

const deletePatch = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (!role) {
      return res.json({
        success: false,
        message: "Nhóm quyền không tồn tại",
      });
    }

    await Role.updateOne({ _id: id }, { deleted: true });

    res.json({
      success: true,
      message: "Xóa nhóm quyền thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Xóa nhóm quyền thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  getPermissions,
  index,
  createPost,
  update,
  updatePatch,
  deletePatch,
};

