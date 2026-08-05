// Expiry reminder email bhejne ka helper function
const transporter = require('../config/nodemailer');

const sendExpiryEmail = async (userEmail, userName, documentTitle, expiryDate) => {
  const formattedDate = new Date(expiryDate).toDateString();

  const mailOptions = {
    from: `"Digital Locker" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `⚠️ Document Expiring Soon: ${documentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${userName},</h2>
        <p>Your document <strong>"${documentTitle}"</strong> is expiring soon.</p>
        <p><strong>Expiry Date:</strong> ${formattedDate}</p>
        <p>Please log in to your Digital Locker to renew or update this document.</p>
        <br/>
        <p>— Digital Locker Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${userEmail} for "${documentTitle}"`);
    return true; //  success
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false; //  failure
  }
};
module.exports = sendExpiryEmail;