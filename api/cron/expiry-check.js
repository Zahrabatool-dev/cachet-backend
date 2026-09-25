// Vercel ye route daily automatically call karega — node-cron ka replacement
const connectDB = require('../../config/db');
const { checkExpiringDocuments } = require('../../cron/expiryChecker');

module.exports = async (req, res) => {
  // Sirf Vercel ka apna cron system hi ye route call kar sake, bahar se koi nahi
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();
  await checkExpiringDocuments();
  res.status(200).json({ message: 'Expiry check completed' });
};