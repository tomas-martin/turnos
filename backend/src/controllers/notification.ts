import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification';
import { BadRequestError } from '../utils/errors';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const notifications = await NotificationService.getNotificationsForUser(req.user.id);
      
      return res.status(200).json({
        status: 'success',
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Usuario no autenticado');
      }

      await NotificationService.markAllAsRead(req.user.id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Todas las notificaciones marcadas como leídas'
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const { id } = req.params;
      await NotificationService.markAsRead(id, req.user.id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Notificación marcada como leída'
      });
    } catch (error) {
      next(error);
    }
  }
}
