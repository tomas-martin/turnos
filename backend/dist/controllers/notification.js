"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_1 = require("../services/notification");
const errors_1 = require("../utils/errors");
class NotificationController {
    static async getNotifications(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.BadRequestError('Usuario no autenticado');
            }
            const notifications = await notification_1.NotificationService.getNotificationsForUser(req.user.id);
            return res.status(200).json({
                status: 'success',
                data: notifications
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async markAllAsRead(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.BadRequestError('Usuario no autenticado');
            }
            await notification_1.NotificationService.markAllAsRead(req.user.id);
            return res.status(200).json({
                status: 'success',
                message: 'Todas las notificaciones marcadas como leídas'
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.BadRequestError('Usuario no autenticado');
            }
            const { id } = req.params;
            await notification_1.NotificationService.markAsRead(id, req.user.id);
            return res.status(200).json({
                status: 'success',
                message: 'Notificación marcada como leída'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
