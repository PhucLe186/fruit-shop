const express = require("express");
const Product = require("../../models/product.model");
const ProductCategory = require("../../models/productCategory.model");

const index = async (req, res) => {
  try {
    const categories = await ProductCategory.find({
      deleted: false,
      status: "active",
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách danh mục sản phẩm thất bại",
      error: error.message,
    });
  }
};

const detail = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await ProductCategory.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    });
    
    if (!category) {
      return res.json({
        success: false,
        message: "Danh mục sản phẩm không tồn tại",
      });
    }

    const products = await Product.find({
      category: category._id,
      deleted: false,
      status: "active",
    }).populate("category");
    
    res.json({
      success: true,
      message: "Lấy chi tiết sản phẩm theo danh mục thành công",
      category: category,
      products: products,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy chi tiết sản phẩm theo danh mục thất bại",
      error: error.message,
    });
  }
}
module.exports = {
  index,
  detail
};
