const express = require("express");
const ProductCategory = require("../../models/productCategory.model");
const index = async (req, res) => {
  const categories = await ProductCategory.find({
    deleted: false,
  });

  res.json({
    success: true,
    data: categories,
  });
};

const createPost = async (req, res) => {
  const newCategory = new ProductCategory(req.body);
  await newCategory.save();
  try {
    res.json({
      success: true,
      message: "Thêm danh mục sản phẩm thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Thêm danh mục sản phẩm thất bại",
      error: error.message,
    });
  }
};

const deletePatch = async (req, res) => {
  try {
    const { id } = req.params;
    await ProductCategory.updateOne({ _id: id }, { deleted: true });
    res.json({
      success: true,
      message: "Xóa danh mục sản phẩm thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Xóa danh mục sản phẩm thất bại",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findOne(
      { _id: id },
      { deleted: false }
    );
    if (!category) {
      return res.json({
        success: false,
        message: "Danh mục sản phẩm không tồn tại",
      });
    }

    res.json({
      success: true,
      message: "Lấy dữ liệu danh mục thành công!",
      data: category,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật danh mục sản phẩm thất bại",
      error: error.message,
    });
  }
};

const updatePatch = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ProductCategory.findOne({
      _id: id,
      deleted: false
    });
    
    if (!category) {
      return res.json({
        success: false,
        message: "Danh mục sản phẩm không tồn tại",
      });
    }
    
    const updateData = { ...req.body };
    delete updateData._id;
    
    await ProductCategory.updateOne(
      { _id: id },
      updateData
    );
    
    res.json({
      success: true,
      message: "Cập nhật danh mục sản phẩm thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật danh mục sản phẩm thất bại",
      error: error.message,
    });
  }
};

module.exports = {
  index,
  createPost,
  deletePatch,
  update,
  updatePatch
};
