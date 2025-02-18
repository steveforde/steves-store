require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "sforde08@gmail.com",  // Replace with your own email
    subject: "Test Email",
    text: "This is a test email from Nodemailer",
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error("❌ Error sending test email:", error);
    } else {
        console.log("✅ Test email sent! Message ID:", info.messageId);
    }
});
