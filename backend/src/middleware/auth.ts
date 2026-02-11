import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
    console.log('❌ [AUTH] No se proporcionó token');
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded as any;
    console.log('🔑 [AUTH] Token decodificado:', { sub: req.user?.sub, role: req.user?.role, email: req.user?.email });
    next();
  } catch (error) {
    console.log('❌ [AUTH] Token inválido o expirado');
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para verificar que el usuario sea ADMIN
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Log para debug - puedes quitar esto en producción
  console.log('🔐 [AUTH] Verificando acceso ADMIN');
  console.log('🔐 [AUTH] Usuario:', req.user ? { sub: req.user.sub, email: req.user.email, role: req.user.role } : 'No autenticado');
  console.log('🔐 [AUTH] Ruta:', req.method, req.originalUrl);

  if (!req.user) {
    console.log('❌ [AUTH] Rechazado: No hay token');
    return res.status(401).json({ error: 'Token requerido' });
  }

  if (req.user.role !== 'ADMIN') {
    console.log('❌ [AUTH] Rechazado: Rol insuficiente -', req.user.role);
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol ADMIN' });
  }

  console.log('✅ [AUTH] Acceso permitido');
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
