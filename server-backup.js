require("dotenv").config(); // Load environment variables
console.log("✅ Environment:", process.env.MONGO_URI ? "Loaded" : "Missing");

// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const { Types } = require("mongoose");
const path = require("path");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

// Middleware setup
app.use(express.json()); // Enable JSON parsing
app.use(cors());
app.use(express.static("public")); // Serve static files from the 'public' directory

// --- WEBHOOK HANDLER (MUST BE BEFORE express.json()) ---
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    console.log("Webhook received!"); 
    const sig = req.headers["stripe-signature"];
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("Webhook event type:", event.type);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("✅ Payment successful! Session ID:", session.id);

        try {
            const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ["line_items"]
            });

            console.log("🛒 Order details:", expandedSession);
            console.log("✅ Fulfilling order...");
        } catch (error) {
            console.error("❌ Error retrieving session:", error);
            return res.status(500).send(`Error retrieving session: ${error.message}`);
        }
    }

    res.status(200).send();
});

// --- CREATE CHECKOUT SESSION ROUTE ---
app.post("/create-checkout-session", async (req, res) => {
    console.log("--- /create-checkout-session route hit ---"); 
    try {
        const { cartItems } = req.body;
        console.log("Received cartItems from client:", cartItems);

        if (!cartItems || !Array.isArray(cartItems)) {
            console.error("ERROR: Invalid cartItems data received.");
            return res.status(400).json({ error: 'Invalid cartItems data. Expected an array.' });
        }

        const lineItems = cartItems.map(item => {
            if (!item || typeof item.name !== 'string' || typeof item.price !== 'number' || typeof item.quantity !== 'number' || typeof item.image !== 'string') {
                console.error("❌ Invalid item format:", item);
                throw new Error("Invalid item format. Each item must have 'name' (string), 'price' (number), 'quantity' (number), and 'image' (string).");
            }

            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                        images: [item.image]
                    },
                    unit_amount: Math.round(item.price * 100), 
                },
                quantity: item.quantity,
            };
        });

        console.log("All lineItems for Stripe:", lineItems);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/cancel.html`,
        });

        console.log("Stripe session created:", session);

        res.json({ url: session.url });
    } catch (error) {
        console.error("❌ Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session", details: error.message });
    }
});

// --- SERVE INDEX PAGE ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- PRODUCTS ENDPOINT ---
app.get("/api/products", async (req, res) => {
    try {
        const products = await mongoose.connection.db.collection("products").find({}).toArray();
        res.json(products);
    } catch (err) {
        console.error("❌ Products Error:", err);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// --- UPDATE STOCK ---
app.post("/api/update-stock", async (req, res) => {
    const { productId, quantity } = req.body;
    
    if (!Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
    }

    try {
        const result = await mongoose.connection.db.collection("products")
            .updateOne({ _id: new Types.ObjectId(productId) }, { $inc: { stock: -quantity } });

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Stock Update Error:", err);
        res.status(500).json({ error: "Failed to update stock" });
    }
});

// --- HEALTH CHECK ROUTE ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

