const express = require("express");
const Product = require("../../models/product.model");

const index = async (req, res) => {
  try {
    const products = await Product.find({
      deleted: false,
    }).populate("category").sort({ position: -1 });
    

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

const createPost = async (req, res) => {
  try {
    const { name, category, price, compare_price, description, status, position } = req.body;
    
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.json({
        success: false,
        message: "Vui lòng upload ít nhất một ảnh",
      });
    }
    
    let productPosition;
    
    if (position) {
      productPosition = parseInt(position);
    } else {
      const maxPositionProduct = await Product.findOne({ deleted: false })
        .sort({ position: -1 })
        .select("position");
      const maxPosition = maxPositionProduct && maxPositionProduct.position !== undefined 
        ? maxPositionProduct.position 
        : 0;
      productPosition = maxPosition + 1;
    }
    
    let imagePosition = 1;
    const imagesWithPosition = req.uploadedFiles.map((image) => {
      const imageData = {
        ...image,
        position: imagePosition,
      };
      imagePosition++;
      return imageData;
    });
    
    const productData = {
      name,
      category,
      price: price ? Number(price) : undefined,
      compare_price: compare_price ? Number(compare_price) : undefined,
      description,
      status: status || "active",
      position: productPosition,
      images: imagesWithPosition,
    };
    
    const newProduct = new Product(productData);
    await newProduct.save();
    
    res.json({
      success: true,
      message: "Thêm sản phẩm thành công",
      data: newProduct,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Thêm sản phẩm thất bại",
      error: error.message,
    });
  }
};

const deletePatch = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.updateOne({ _id: id }, { deleted: true });
    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Xóa sản phẩm thất bại",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({
      _id: id,
      deleted: false,
    });
    
    if (!product) {
      return res.json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    res.json({
      success: true,
      message: "Lấy dữ liệu sản phẩm thành công!",
      data: product,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lấy dữ liệu sản phẩm thất bại",
      error: error.message,
    });
  }
};

const updatePatch = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({
      _id: id,
      deleted: false,
    });
    
    if (!product) {
      return res.json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }
    
    const { name, category, price, compare_price, description, status, position, existingImages } = req.body;
    console.log(existingImages);
    
    const updateData = {
      name,
      category,
      price: price ? Number(price) : undefined,
      compare_price: compare_price ? Number(compare_price) : undefined,
      description,
      status,
    };
    
    if (position) {
      updateData.position = parseInt(position);
    }
    
    let allImages = [];
    let hasExistingImages = false;
    
    if (existingImages !== undefined) {
      hasExistingImages = true;
      const existingImagesArray = Array.isArray(existingImages) 
        ? existingImages 
        : [existingImages];
      
      let parsedExistingImages = [];
      
      existingImagesArray.forEach((imgStr) => {
        try {
          const parsed = typeof imgStr === 'string' ? JSON.parse(imgStr) : imgStr;
          if (Array.isArray(parsed)) {
            parsedExistingImages = [...parsedExistingImages, ...parsed];
          } else if (parsed && parsed.url) {
            parsedExistingImages.push(parsed);
          }
        } catch (e) {
          if (imgStr && imgStr.url) {
            parsedExistingImages.push(imgStr);
          }
        }
      });
      
      allImages = parsedExistingImages.filter(img => img && img.url);
    }
    
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      allImages = [...allImages, ...req.uploadedFiles];
    }
    
    if (hasExistingImages || (req.uploadedFiles && req.uploadedFiles.length > 0)) {
      let imagePosition = 1;
      const imagesWithPosition = allImages.map((image) => {
        const imageData = {
          url: image.url,
          public_id: image.public_id,
          position: imagePosition,
        };
        imagePosition++;
        return imageData;
      });
      
      updateData.images = imagesWithPosition;
    }
    
    await Product.updateOne({ _id: id }, updateData);
    
    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Cập nhật sản phẩm thất bại",
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
