const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        slug: "name",
        unique: true,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        default: "active",
        enum: ["active", "inactive"],
    },
    deleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    autoCreate: true,
});

schema.plugin(slug);

const ProductCategory = mongoose.model("Product Category", schema);

module.exports = ProductCategory;