// scripts/sendEmail.js
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Order Confirmation - Your Purchase",
    html: `
      <h2>Thank you for your order!</h2>
      <ul>
        ${orderDetails.map(item => `<li>${item.name} - €${item.price} x ${item.quantity}</li>`).join("")}
      </ul>
      <p>Your order will be processed soon.</p>
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