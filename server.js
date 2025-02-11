const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

// ✅ Enable JSON Parsing & CORS
app.use(express.json());
app.use(cors());

// ✅ Serve Static Files
app.use(express.static("public"));

// ✅ Route for Homepage (Loads index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Stripe Setup
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Route for Success Page
app.get("/success", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "success.html"));
});

// ✅ Route for Cancel Page
app.get("/cancel", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cancel.html"));
});

// ✅ Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
