const Promotion = require("../../models/promotion.model");

// [GET] /admin/promotion - Lấy tất cả khuyến mãi (kể cả hết hạn)
const index = async (req, res) => {
  try {
    const promotions = await Promotion.find({
      deleted: false,
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: promotions });
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
    const promotion = new Promotion(req.body);
    await promotion.save();
    res.json({
      success: true,
      message: "Tạo khuyến mãi thành công",
      data: promotion,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Tạo khuyến mãi thất bại",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updated = await Promotion.findOne({ _id: id });
    if (!updated) {
      return res.json({ success: false, message: "Không tìm thấy khuyến mãi" });
    }
    await Promotion.updateOne({ _id: id }, req.body);
    res.json({ success: true, message: "Cập nhật thành công", data: updated });
  } catch (error) {
    console.log("error là: ", error);
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
    const promotion = await Promotion.findById(id);
    if (!promotion)
      return res.json({ success: false, message: "Không tìm thấy khuyến mãi" });

    promotion.status = promotion.status === "active" ? "inactive" : "active";
    await promotion.save();

    res.json({
      success: true,
      message: `Đã chuyển trạng thái sang ${promotion.status}`,
      data: promotion,
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
    const promotion = await Promotion.findById(id, { deleted: true });
    if (!promotion) {
      return res.json({ success: false, message: "Không tìm thấy khuyến mãi" });
    }
    res.json({ success: true, message: "Đã xóa khuyến mãi", data: promotion });
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
