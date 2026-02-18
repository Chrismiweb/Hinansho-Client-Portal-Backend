const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM,
      subject,
      html,
      attachments
    };

    const response = await sgMail.send(msg);

    return response;
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error.message);
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;
