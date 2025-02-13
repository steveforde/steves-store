const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }, // ✅ Stock management!
    image: String,
    description: String
});

module.exports = mongoose.model("Product", ProductSchema);
