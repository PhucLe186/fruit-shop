const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

const schema = new mongoose.Schema({
    name: String,
    slug: {
        type: String,
        slug: "name",
        unique: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product Category",
    },
    price: Number,
    compare_price: Number,
    description: String,
    images: [
        {
            url: String,
            public_id: String,
            position: Number
        }
    ],
    status: {
        type: String,
        default: "active",
        enum: ["active", "inactive", "draft"],
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    position: Number
}, {
    timestamps: true,
    autoCreate: true,
});

schema.plugin(slug);

const Product = mongoose.model("Product", schema);

module.exports = Product;