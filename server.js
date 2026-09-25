const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const shareRoutes = require('./routes/shareRoutes');
const userRoutes = require('./routes/userRoutes'); 
const { startExpiryCron } = require('./cron/expiryChecker');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');



connectDB();

const app = express();

// Vercel ke proxy ke peeche hosted hai, is liye ye zaroori hai warna
// express-rate-limit 'X-Forwarded-For' header pe ValidationError throw
// karta hai jo poore process ko crash kar deta hai
app.set('trust proxy', 1);

// Explicit list of allowed origins — production frontend + local dev
const allowedOrigins = [
  'http://localhost:3000',
  'https://cachet-frontend.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Preflight (OPTIONS) requests explicitly handle karo — Express 5 compatible wildcard

app.use(express.json());

// Security headers set karta hai (XSS, clickjacking, etc. se basic protection)
// crossOriginResourcePolicy aur crossOriginOpenerPolicy ko relax kiya taako
// cross-origin frontend (Vercel) se backend (SnapDeploy) tak requests aur
// Google Sign-In popup dono bina block hue kaam karein
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// MongoDB operator injection se bachata hai (jaise { "$gt": "" } wale malicious inputs)
// Custom middleware kyunke express-mongo-sanitize Express 5 ke sath compatible nahi hai
const sanitizeInput = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitizeInput(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  sanitizeInput(req.body);
  sanitizeInput(req.params);
  sanitizeInput(req.query);
  next();
});

// General rate limiter - sab routes ke liye
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute ka window
  max: 100, // is window mein max 100 requests per IP
  message: { message: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Strict limiter sirf auth routes ke liye (brute-force login attempts rokne ke liye)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 15 min mein sirf 10 login/signup attempts
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Digital Locker API is running 🔒');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
   startExpiryCron();
});