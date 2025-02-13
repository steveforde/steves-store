require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product"); // ✅ Correct path to Product model

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Sample Products to Add
const sampleProducts = [
    { name: "Laptop", price: 999, stock: 10, image: "laptop.jpg", description: "High-end laptop" },
    { name: "Phone", price: 499, stock: 20, image: "phone.jpg", description: "Latest smartphone" },
    { name: "Headphones", price: 99, stock: 15, image: "headphones.jpg", description: "Wireless headphones" }
];

// ✅ Insert Products into MongoDB Atlas
Product.insertMany(sampleProducts)
    .then(() => {
        console.log("✅ Sample products added to MongoDB Atlas!");
        mongoose.connection.close(); // Close connection after inserting
    })
    .catch(err => console.error("❌ Error adding products:", err));
