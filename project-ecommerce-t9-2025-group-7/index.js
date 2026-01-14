const express = require("express");
const dotenv = require("dotenv");
const database = require("./configs/mongodb.connect");
const adminRoutes = require("./routes/admin/index.route");
const clientRoutes = require("./routes/client/index.route");
const port = 5000; // cổng mà server sẽ lắng nghe
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

dotenv.config();

database.connectDB();
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoutes);
app.use("/api", clientRoutes);

app.listen(port, () => {
  console.log(`Đang lắng nghe cổng ${port}`);
});
