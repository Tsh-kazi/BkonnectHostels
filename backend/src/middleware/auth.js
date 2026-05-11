const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'production-super-secret-jwt-key';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Access denied. No token provided.' });
  
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. You do not have the required role.' });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
