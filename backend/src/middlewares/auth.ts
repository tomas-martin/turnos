import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role } from '@prisma/client';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Acceso denegado, token no provisto'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'dev-access-secret-12345-extremely-long-string-for-security';
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: Role };
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return next(new UnauthorizedError('Token inválido o expirado'));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuario no autenticado'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('No tienes permisos para realizar esta acción'));
    }
    
    next();
  };
};
