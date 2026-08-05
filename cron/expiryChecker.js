// Ye cron job daily chalega aur check karega kaunse documents 30 din mein expire ho rahe hain
const cron = require('node-cron');
const Document = require('../models/Document');
const User = require('../models/User');
const sendExpiryEmail = require('../utils/sendExpiryEmail');

const REMINDER_DAYS_BEFORE = 30; // ye number change karke test kar sakti ho (jaise 1 din test ke liye)

const checkExpiringDocuments = async () => {
  try {
    console.log('Running expiry check...', new Date().toLocaleString());

    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + REMINDER_DAYS_BEFORE);

    // Wo documents dhundo jinki expiry aane wale 30 din mein hai
    // aur jinko reminder abhi tak nahi bheja gaya
    const expiringDocuments = await Document.find({
      expiryDate: { $ne: null, $gte: today, $lte: reminderDate },
      reminderSent: false,
    }).populate('userId', 'name email'); // User ka naam/email bhi mil jayega

    for (const doc of expiringDocuments) {
  if (doc.userId) {
    const emailSent = await sendExpiryEmail(
      doc.userId.email,
      doc.userId.name,
      doc.title,
      doc.expiryDate
    );

    // Sirf tab true karo jab email successfully gayi ho
    if (emailSent) {
      doc.reminderSent = true;
      await doc.save();
    }
  }
}

    console.log(`Checked ${expiringDocuments.length} expiring document(s)`);
  } catch (error) {
    console.error('Expiry check failed:', error.message);
  }
};

// Har din raat 8 baje chalega (server time ke hisab se)
// Cron format: minute hour day month weekday
const startExpiryCron = () => {
  cron.schedule('0 20 * * *', checkExpiringDocuments);
  console.log('Expiry reminder cron job scheduled');
};

module.exports = { startExpiryCron, checkExpiringDocuments };