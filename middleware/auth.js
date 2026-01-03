/**
 * Authentication Middleware
 * Validates Bearer token for API requests
 */

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized',
      details: 'Missing Authorization header'
    });
  }

  const expectedToken = `Bearer ${process.env.BEARER_TOKEN}`;
  
  if (authHeader !== expectedToken) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized',
      details: 'Invalid bearer token'
    });
  }

  next();
};
