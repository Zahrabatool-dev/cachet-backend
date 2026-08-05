const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendResetPasswordEmail } = require('../config/nodemailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Helper function: JWT token generate karta hai
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // 7 din tak valid rahega token
  });
};

// SIGNUP controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check karo user pehle se to exist nahi karta
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Password ko hash karo (10 rounds of salting)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Naya user create karo
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Token generate karo
    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// LOGIN controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // User dhundo email se
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Password compare karo (hashed vs plain)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// FORGOT PASSWORD controller — reset token generate karke email pe bhejta hai
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Security: user exist na ho tab bhi same success response do,
    // taake attacker ko pata na chale kaunse emails registered hain (email enumeration prevent)
    if (!user) {
      return res.status(200).json({
        message: 'If an account exists, a reset link has been sent.',
      });
    }

    // Reset token generate karo (raw token user ko milega, hashed version DB mein save hoga)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minute tak valid
    await user.save();

   const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

   await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// RESET PASSWORD controller — token verify karke naya password set karta hai
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // expire nahi hona chahiye
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GOOGLE SIGN-IN controller — Google ID token verify karke user find/create karta hai
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body; // frontend se aayega Google ka ID token

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Google ke sath token verify karo
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload; // picture add kiya

    let user = await User.findOne({ email });

    if (!user) {
      // Naya user — password ki zarurat nahi, random placeholder hash kar dete hain
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        googleId,
        avatar: picture, // naye user ke liye save karo
      });
    } else {
      // Existing user — googleId link karo aur avatar update/set karo
      if (!user.googleId) user.googleId = googleId;
      if (picture && user.avatar !== picture) user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null, // response mein bhejo
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};