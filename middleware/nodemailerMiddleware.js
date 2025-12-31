const nodemailer = require("nodemailer");
const {configDotenv} = require('dotenv');

// Create the transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
    },
});

// Function to send email
const sendContactEmail = async (senderMail, senderName, receiverMail, message, subject) => {
    const mailOptions = {
        from: {
            name: senderName,
            address: senderMail,
        },
        to: receiverMail,
        subject,
        html: message,
    };

    transporter.sendMail(mailOptions, function (info, error) {
		if (error) {
			console.log(error);
			res.status(500).json({error: 'Failed to send mail'});
		} else {
			console.log('Email Sent' + info.response);
		}
	});
};

// Export both transporter and sendContactEmail
module.exports = { transporter, sendContactEmail };
