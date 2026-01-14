const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const customerSchema = new mongoose.Schema(
  {
    fullname: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    token: { type: String },
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password trước khi lưu (save)
customerSchema.pre("save", async function (next) {
  const customer = this;

  // Chỉ hash khi password mới hoặc bị thay đổi
  if (!customer.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(customer.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Thêm method so sánh password khi login
customerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
