const Promotion = require("../../models/promotion.model");

const getActivePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({
      deleted: false,
      status: "active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách khuyến mãi thất bại",
      error: error.message,
    });
  }
};

const checkPromotionCode = async (req, res) => {
  try {
    const { code, orderValue } = req.body;

    const promotion = await Promotion.findOne({
      code,
      deleted: false,
      status: "active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
    if (!promotion) {
      return res.json({
        success: false,
        message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn",
      });
    }

    if (orderValue < promotion.minOrderValue) {
      return res.json({
        success: false,
        message: `Đơn hàng phải từ ${promotion.minOrderValue} trở lên mới được áp dụng`,
      });
    }

    res.json({
      success: true,
      message: "Mã khuyến mãi hợp lệ",
      data: promotion,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Kiểm tra mã khuyến mãi thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  getActivePromotions,
  checkPromotionCode,
};
