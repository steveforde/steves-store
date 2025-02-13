require("dotenv").config(); // MUST BE FIRST LINE
console.log("✅ Environment:", process.env.MONGO_URI ? "Loaded" : "Missing");

// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const { Types } = mongoose;

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));


// Middleware
app.use(cors());
app.use(express.static("public"));

// Stripe Webhook (must come before express.json())
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"]
      });

      // Send confirmation email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"Store" <${process.env.EMAIL_USER}>`,
        to: session.customer_details.email,
        subject: "Order Confirmation",
        html: `
          <h1>Thank you for your order!</h1>
          <p>Total: €${(expandedSession.amount_total / 100).toFixed(2)}</p>
          <h3>Items:</h3>
          <ul>
            ${expandedSession.line_items.data.map(item => `
              <li>${item.quantity}x ${item.description} - €${(item.amount_total / 100).toFixed(2)}</li>
            `).join("")}
          </ul>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("📧 Email sent to:", session.customer_details.email);
    } catch (err) {
      console.error("❌ Email error:", err);
    }
  }

  res.json({ received: true });
});

// Regular Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Products Endpoint
app.get("/api/products", async (req, res) => {
  try {
    const products = await mongoose.connection.db.collection("products")
      .find({})
      .toArray();

    res.json(products);
  } catch (err) {
    console.error("❌ Products Error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Update Stock
app.post("/api/update-stock", async (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const result = await mongoose.connection.db.collection("products")
      .updateOne(
        { _id: new Types.ObjectId(productId) },
        { $inc: { stock: -quantity } }
      );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Stock Update Error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// Stripe Checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: req.body.items.map(item => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.DOMAIN || "http://localhost:3000"}/success`,
      cancel_url: `${process.env.DOMAIN || "http://localhost:3000"}/cancel`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("❌ Stripe Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

