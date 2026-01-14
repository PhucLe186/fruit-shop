const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});
const streamUpload = (buffer) => {
  try {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "Kim Quang",
          public_id: Date.now().toString(),
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(stream);
    });
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = {
  streamUpload,
};