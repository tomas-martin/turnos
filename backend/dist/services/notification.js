"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class NotificationService {
    static async createNotification(userId, title, message) {
        return prisma_1.default.notification.create({
            data: {
                userId,
                title,
                message,
                read: false
            }
        });
    }
    static async getNotificationsForUser(userId) {
        return prisma_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // limitar a los últimos 50
        });
    }
    static async markAsRead(notificationId, userId) {
        return prisma_1.default.notification.updateMany({
            where: { id: notificationId, userId },
            data: { read: true }
        });
    }
    static async markAllAsRead(userId) {
        return prisma_1.default.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
    }
}
exports.NotificationService = NotificationService;
