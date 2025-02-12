require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware setup
app.use(cors());
app.use(express.static("public"));

// Stripe webhook handler (MUST come before express.json())
app.post("/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        
        // Retrieve expanded session details (fixing the expand issue)
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ["line_items"] }  // ✅ Correct way
        );

        // Prepare order details
        const orderDetails = {
          amount: expandedSession.amount_total / 100,
          items: expandedSession.line_items.data.map(item => ({
            name: item.description, // ✅ Use "description"
            quantity: item.quantity,
            price: (item.amount_total / 100).toFixed(2),
          }))
        };

        // Send confirmation email
        await sendOrderConfirmation(session.customer_details.email, orderDetails);
      }

      res.status(200).end();
    } catch (err) {
      console.error("❌ Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);


// Regular middleware for other routes
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

app.get("/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cancel.html"));
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Email sending function
const sendOrderConfirmation = async (email, order) => {
  const mailOptions = {
    from: `"My Store" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Thank you for your order!",
    html: `
      <h1>Order Confirmation</h1>
      <p>Total: €${order.amount.toFixed(2)}</p>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `
          <li>${item.quantity}x ${item.name} - €${item.price}</li>
        `).join("")}
      </ul>
      <p>Thank you for shopping with us!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", email);
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
