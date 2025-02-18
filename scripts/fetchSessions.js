require("dotenv").config(); // Load environment variables from .env file
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function fetchSession() {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      "cs_test_a1ldwvxLR5OfrYAbQarEvPnBZ3BQXEnypVkHWzW9b",
      { expand: ["line_items"] }
    );
    console.log("✅ Checkout Session:", session);
  } catch (error) {
    console.error("❌ Error fetching session:", error);
  }
}

fetchSession();