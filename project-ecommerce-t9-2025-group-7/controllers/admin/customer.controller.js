const Customer = require("../../models/customer.model");

const index = async (req, res) => {
  try {
    const customers = await Customer.find({ deleted: false }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách thất bại",
      error: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json({
      success: true,
      message: "Tạo khách hàng thành công",
      data: customer,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Tạo khách hàng thất bại",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Customer.findById(id, req.body);
    if (!updated)
      return res.json({ success: false, message: "Không tìm thấy khách hàng" });
    res.json({ success: true, message: "Cập nhật thành công", data: updated });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật thất bại",
      error: error.message,
    });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer)
      return res.json({ success: false, message: "Không tìm thấy khách hàng" });

    customer.status = customer.status === "active" ? "inactive" : "active";
    await customer.save();

    res.json({
      success: true,
      message: `Đã chuyển trạng thái sang ${customer.status}`,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Đổi trạng thái thất bại",
      error: error.message,
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id, { deleted: true });
    if (!customer)
      return res.json({ success: false, message: "Không tìm thấy khách hàng" });
    res.json({ success: true, message: "Đã xóa khách hàng" });
  } catch (error) {
    res.json({ success: false, message: "Xóa thất bại", error: error.message });
  }
};

module.exports = {
  index,
  create,
  update,
  changeStatus,
  deleteItem,
};
