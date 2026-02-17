import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include admin and user
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        role: string;
      };
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

// Verify Admin Token
export const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';

    const decoded = jwt.verify(token, secret) as any;

    // Check if it's an admin token
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Set both req.admin and req.user for compatibility
    req.admin = {
      id: decoded.id,
      role: decoded.role
    };

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Admin token verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Verify User Token
export const verifyUserToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';

    const decoded = jwt.verify(token, secret) as any;

    req.user = {
      id: decoded.id,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    console.error('User token verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};