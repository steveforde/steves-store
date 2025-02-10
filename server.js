require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const express = require("express");
const cors = require("cors");




const app = express();
app.use(express.json());
app.use(cors());

// Create Stripe Checkout Session
app.post("/create-checkout-session", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: req.body.items.map(item => ({
                price_data: {
                    currency: "eur",
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            })),
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
