const { streamUpload } = require("../../helpers/streamUpload.helper");

const uploadMany = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      req.uploadedFiles = [];
      return next();
    }

    const uploadPromises = req.files.map((file) => {
      return streamUpload(file.buffer);
    });

    const uploadResults = await Promise.all(uploadPromises);

    const uploadedImages = uploadResults.map((result) => {
      if (result && result.secure_url && result.public_id) {
        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      }
      return null;
    }).filter((image) => image !== null);

    req.uploadedFiles = uploadedImages;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi upload file",
      error: error.message,
    });
  }
};

module.exports = {
  uploadMany,
};
