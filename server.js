const express = require('express');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Serve static files
app.use(express.static('public'));

// Webhook route (must come before body-parsing middleware)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Webhook received and verified:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed! Session ID:', session.id);
      const email = session.customer_email || 'sforde08@gmail.com'; // Fallback email
      console.log('Customer email:', email);

      try {
        const lineItems = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
        const orderDetails = lineItems.line_items.data.map(item =>
          `${item.description || 'Item'} - €${(item.amount_total / 100).toFixed(2)} x ${item.quantity}`
        ).join('\n');

        const emailMessage = `
          <h1>Payment Successful!</h1>
          <p>Thank you for your order!</p>
          <p>Details:</p>
          <ul>${orderDetails.split('\n').map(detail => `<li>${detail}</li>`).join('')}</ul>
          <p>Your order will be processed soon.</p>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Order Confirmation - Your Purchase',
          html: emailMessage,
        });
        console.log('Confirmation email sent to:', email);
      } catch (error) {
        console.error('Error processing checkout.session.completed:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.sendStatus(200); // Respond to Stripe with success
});

// Apply JSON parsing for other routes (after webhook)
app.use(express.json());

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  const { cartItems, customerEmail } = req.body;
  console.log('Received cartItems and customerEmail:', { cartItems, customerEmail });

  try {
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
      customer_email: customerEmail || 'sforde08@gmail.com',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).send('Error creating checkout session');
  }
});

// Success and cancel pages
app.get('/success.html', (req, res) => {
  res.send('<h1>Payment Successful! Thank you for your purchase.</h1>');
});

app.get('/cancel.html', (req, res) => {
  res.send('<h1>Payment Canceled. Please try again.</h1>');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
