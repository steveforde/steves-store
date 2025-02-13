// db.js
const { MongoClient } = require('mongodb');

// Use your MongoDB Atlas connection string here
const uri = "mongodb+srv://sforde08:5nYhrUSRXP076JC6@ecommercedb.uujm0.mongodb.net/?retryWrites=true&w=majority&appName=EcommerceDB";

// Optional: Use environment variables instead for security
// const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return client.db("test"); // Adjust database name if needed
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
