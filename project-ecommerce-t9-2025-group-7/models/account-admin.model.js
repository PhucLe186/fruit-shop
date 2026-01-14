const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const accountAdminSchema = new mongoose.Schema(
  {
    fullname: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    token: { type: String },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    permission: Array,
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountAdminSchema.pre("save", async function (next) {
  const accountAdmin = this;

  if (!accountAdmin.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    accountAdmin.password = await bcrypt.hash(accountAdmin.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

accountAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const AccountAdmin = mongoose.model("Account Admin", accountAdminSchema);
module.exports = AccountAdmin;
