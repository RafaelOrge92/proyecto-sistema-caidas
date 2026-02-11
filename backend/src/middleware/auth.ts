import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';

const JWT_SECRET = getJwtSecret();

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: string;
        fullName: string;
        iat: number;
        exp: number;
      };
    }
  }
}

/**
 * Middleware para verificar que el usuario esté autenticado
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as any;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para verificar que el usuario sea ADMIN
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol ADMIN' });
  }

  next();
};

/**
 * Middleware para verificar que el usuario tenga ciertos roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};
