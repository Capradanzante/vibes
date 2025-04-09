const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = await authService.validateToken(token);
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Permessi insufficienti' });
    }
    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  requireRole
}; 