const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOrderConfirmation(email, orderDetails) {
  console.log("📤 Preparing to send email...");
  console.log("Email Recipient:", email);
  console.log("Order Details:", orderDetails);

  // Calculate total
  const total = orderDetails.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Generate order details HTML for the table
  const orderDetailsHTML = orderDetails.map(item => `
    <tr>
      <td style="padding: 8px;">${item.name}</td>
      <td style="padding: 8px;">€${item.price.toFixed(2)}</td>
      <td style="padding: 8px;">${item.quantity}</td>
      <td style="padding: 8px;">€${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Order Confirmation - Your Purchase",
    html: `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #007bff;">Order Confirmation</h1>
        <p>Thank you for shopping with StevesStore!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: left;">Price</th>
              <th style="padding: 8px; text-align: left;">Quantity</th>
              <th style="padding: 8px; text-align: left;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetailsHTML}
          </tbody>
        </table>
        <p><strong>Total: €${total.toFixed(2)}</strong></p>
        <p style="color: #666; font-size: 12px;">Your order will be processed soon.</p>
      </body>
      </html>
    `,
  };

  console.log("📧 Mail options:", mailOptions);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!", info);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

module.exports = sendOrderConfirmation;