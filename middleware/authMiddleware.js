// Ye middleware protected routes ko secure karega
// Har protected request ke sath valid JWT token hona chahiye
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Header se token nikalo: "Bearer xyz123..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Token verify karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // req.user mein user id daal do, aage wale controllers use kar saken
      req.user = { id: decoded.id };

      next(); // sab theek hai, aage badho
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = protect;