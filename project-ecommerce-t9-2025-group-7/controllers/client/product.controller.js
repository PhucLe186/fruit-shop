const express = require("express");
const Product = require("../../models/product.model");

const index = async (req, res) => {
  try {
    const products = await Product.find({
      deleted: false,
      status: "active",
    }).populate("category").sort({ position: -1 });
console.log(products);
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy danh sách sản phẩm thất bại",
      error: error.message,
    });
  }
};

const detail = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    }).populate("category");
    
    if (!product) {
      return res.json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }
    
    res.json({
      success: true,
      message: "Lấy chi tiết sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy chi tiết sản phẩm thất bại",
      error: error.message,
    });
  }
}

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      console.log("q is empty");
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");
    const slugRegex = new RegExp(q.trim().replace(/ /g, "-"), "i");
    console.log(slugRegex);

    const products = await Product.find({
      deleted: false,
      status: "active",
      $or: [
        { name: searchRegex },
        { slug: slugRegex },
      ],
    }).populate("category").sort({ position: -1 });
    console.log(products);
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Tìm kiếm sản phẩm thất bại",
      error: error.message,
    });
  }
}

module.exports = {
  index,
  detail,
  search
};
