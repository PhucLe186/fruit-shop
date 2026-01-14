const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");

const index = async (req, res) => {
  try {
    const customerId = req.customer?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để xem giỏ hàng.",
      });
    }

    const cart = await Cart.findOne({ customer: customerId })
      .populate("info_product.product")
      .populate("customer");

    if (!cart) {
      return res.json({
        success: true,
        data: {
          info_product: [],
        },
      });
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Lấy giỏ hàng thất bại",
      error: error.message,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const { info_product } = req.body;
    const customerId = req.customer?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để thêm vào giỏ hàng.",
      });
    }

    if (!info_product || !Array.isArray(info_product) || info_product.length === 0) {
      return res.json({
        success: false,
        message: "Giỏ hàng không được để trống",
      });
    }

    const processedProducts = [];

    for (const item of info_product) {
      if (!item.product || !item.quantity) {
        return res.json({
          success: false,
          message: "Thông tin sản phẩm không đầy đủ",
        });
      }

      const product = await Product.findOne({
        _id: item.product,
        deleted: false,
        status: "active",
      });

      if (!product) {
        return res.json({
          success: false,
          message: `Sản phẩm ${item.product} không tồn tại`,
        });
      }

      const price = product.price || 0;
      const discount = product.discount || 0;
      const priceAfterDiscount = price - (price * discount / 100);
      const total = priceAfterDiscount * item.quantity;

      processedProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: price,
        discount: discount,
        total: total,
      });
    }

    const existingCart = await Cart.findOne({ customer: customerId });

    if (existingCart) {
      for (const newItem of processedProducts) {
        const existingItemIndex = existingCart.info_product.findIndex(
          (item) => item.product.toString() === newItem.product.toString()
        );

        if (existingItemIndex !== -1) {
          existingCart.info_product[existingItemIndex].quantity = newItem.quantity;
          existingCart.info_product[existingItemIndex].price = newItem.price;
          existingCart.info_product[existingItemIndex].discount = newItem.discount;
          existingCart.info_product[existingItemIndex].total = newItem.total;
        } else {
          existingCart.info_product.push(newItem);
        }
      }
      await existingCart.save();

      const populatedCart = await Cart.findById(existingCart._id)
        .populate("info_product.product")
        .populate("customer");

      return res.json({
        success: true,
        message: "Cập nhật giỏ hàng thành công",
        data: populatedCart,
      });
    }
    
    const newCart = new Cart({
      info_product: processedProducts,
      customer: customerId,
    });

    await newCart.save();

    const populatedCart = await Cart.findById(newCart._id)
      .populate("info_product.product")
      .populate("customer");

    res.json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      data: populatedCart,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Thêm vào giỏ hàng thất bại",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const customerId = req.customer?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng.",
      });
    }

    if (!productId) {
      return res.json({
        success: false,
        message: "Vui lòng cung cấp ID sản phẩm cần xóa",
      });
    }

    const result = await Cart.updateOne(
      { customer: customerId },
      { $pull: { info_product: { product: productId } } }
    );

    if (result.matchedCount === 0) {
      return res.json({
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    }

    if (result.modifiedCount === 0) {
      return res.json({
        success: false,
        message: "Sản phẩm không tồn tại trong giỏ hàng",
      });
    }

    const populatedCart = await Cart.findOne({ customer: customerId })
      .populate("info_product.product")
      .populate("customer");

    res.json({
      success: true,
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      data: populatedCart,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Xóa sản phẩm khỏi giỏ hàng thất bại",
      error: error.message,
    });
  }
};

module.exports = {
    createPost,
    index,
    deleteProduct
};

