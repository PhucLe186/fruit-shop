const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Kết nối db thành công!");
    } catch (error) {
        console.log("Kết nối db thất bại!");
        process.exit(1);
    }
}

module.exports = {
    connectDB,
}