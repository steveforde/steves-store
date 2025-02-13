// seedProducts.js
const connectDB = require('./db');

const products = [
  { id: 1, name: "MacBook Pro 14-inch", brand: "Apple", price: 1999.99, image: "images/mbp14.jpeg", stock: 10 },
  { id: 2, name: "Dell XPS 16", brand: "Dell", price: 1599.99, image: "images/xps16.jpg", stock: 15 },
  { id: 3, name: "Lenovo ThinkPad X1", brand: "Lenovo", price: 1499.99, image: "images/lenavo.jpg", stock: 20 },
  { id: 4, name: "HP Spectre x360", brand: "HP", price: 1399.99, image: "images/spectre.jpg", stock: 8 },
  { id: 5, name: "ASUS ROG Gaming", brand: "ASUS", price: 1899.99, image: "images/gamer.jpg", stock: 12 },
  { id: 6, name: "Razer Blade 15", brand: "Razer", price: 1799.99, image: "images/blade18.jpg", stock: 10 },
  { id: 7, name: "Microsoft Surface Laptop", brand: "Microsoft", price: 1199.99, image: "images/micro.jpg", stock: 18 },
  { id: 8, name: "Acer Predator", brand: "Acer", price: 1599.99, image: "images/predator.jpg", stock: 14 },
  { id: 9, name: "MSI Creator", brand: "MSI", price: 1699.99, image: "images/msi.jpg", stock: 9 },
  { id: 10, name: "LG Gram 16", brand: "LG", price: 1299.99, image: "images/Basic.jpg", stock: 25 },
  { id: 11, name: "Alienware m15", brand: "Dell", price: 1999.99, image: "images/laptop.jpg", stock: 7 },
  { id: 12, name: "Samsung Galaxy Book", brand: "Samsung", price: 999.99, image: "images/galaxy.jpg", stock: 30 }
];

async function seedProducts() {
  const db = await connectDB();
  const collection = db.collection("products");

  try {
    // Clear previous products
    await collection.deleteMany({});
    console.log("🗑️ Cleared existing products");

    // Insert new products with stock
    const result = await collection.insertMany(products);
    console.log(`✅ Inserted ${result.insertedCount} products with stock into the database.`);
  } catch (error) {
    console.error("❌ Failed to insert products:", error);
  } finally {
    process.exit(); // Exit script
  }
}

seedProducts();
