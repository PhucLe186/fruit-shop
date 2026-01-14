const verifyDomain = async (req, res, next) => {
  try {
    const referer = req.headers.referer;
    // console.log(req.headers.referer);

    const ALLOWED_TO_TAKE_RESOURCES = (
      process.env.ALLOWED_TO_TAKE_RESOURCES || ""
    ).split(", ");
    if (!referer) {
      return res.status(403).json({
        success: false,
        message: "Truy cập không hợp lệ!",
      });
    }
    for await (const domain of ALLOWED_TO_TAKE_RESOURCES) {
      if (ALLOWED_TO_TAKE_RESOURCES.includes(domain)) {
        next();
        // return;
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

module.exports = {
  verifyDomain,
};
