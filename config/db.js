// MongoDB se connection banane ke liye
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected ');
  } catch (error) {
    console.error('MongoDB Connection Failed ', error.message);
    process.exit(1); // agar connect na ho to server band kar do
  }
};

module.exports = connectDB;