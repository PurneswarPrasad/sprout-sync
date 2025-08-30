import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No authorization header',
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // Token is invalid but we continue without authentication
    next();
  }
};

