const { Resend } = require("resend");

const resendClient = new Resend(process.env.RESEND_API_KEY);

module.exports = resendClient;
