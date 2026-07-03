import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // En desarrollo mostramos el stack trace, en producción podríamos guardarlo en logs
  console.error(`[Error Handler] Path: ${req.path} - Error: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Error de base de datos de Prisma u otros errores inesperados
  return res.status(500).json({
    status: 'error',
    message: 'Ocurrió un error interno en el servidor'
  });
};
