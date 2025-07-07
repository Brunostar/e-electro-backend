const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: `"E-Electro" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
