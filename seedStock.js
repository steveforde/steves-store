require("dotenv").config();
const mongoose = require("mongoose");

async function seedStock() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Update Stock for All 12 Laptops
    const updates = [
      { id: 1, stock: 10 },
      { id: 2, stock: 15 },
      { id: 3, stock: 20 },
      { id: 4, stock: 8 },
      { id: 5, stock: 12 },
      { id: 6, stock: 10 },
      { id: 7, stock: 18 },
      { id: 8, stock: 14 },
      { id: 9, stock: 9 },
      { id: 10, stock: 25 },
      { id: 11, stock: 7 },
      { id: 12, stock: 30 }
    ];

    for (const item of updates) {
      const result = await db.collection("products").updateOne(
        { id: item.id },
        { $set: { stock: item.stock, featured: true } } // Add stock and mark featured
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated Product ID ${item.id} with stock ${item.stock}`);
      } else {
        console.log(`⚠️ Product ID ${item.id} not found`);
      }
    }

    console.log("🌟 Stock levels updated for all featured laptops!");
    process.exit();
  } catch (error) {
    console.error("❌ Stock Update Error:", error);
    process.exit(1);
  }
}

seedStock();
