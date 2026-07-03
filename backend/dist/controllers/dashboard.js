"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const company_1 = require("../services/company");
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
class DashboardController {
    static async getCompanyIdFromUser(req) {
        if (!req.user) {
            throw new errors_1.BadRequestError('Usuario no autenticado');
        }
        const company = await company_1.CompanyService.getCompanyForUser({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        });
        return company.id;
    }
    static async getStats(req, res, next) {
        try {
            const companyId = await DashboardController.getCompanyIdFromUser(req);
            const today = new Date();
            const cleanToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            // 1. Turnos del día (Total y Confirmados/Pendientes)
            const dayAppointments = await prisma_1.default.appointment.findMany({
                where: {
                    branch: { companyId },
                    date: cleanToday
                },
                include: {
                    customer: { include: { user: true } },
                    service: true,
                    employee: { include: { user: true } }
                }
            });
            // 2. Ingresos Totales Cobrados
            const paidPayments = await prisma_1.default.payment.findMany({
                where: {
                    appointment: { branch: { companyId }, status: client_1.AppointmentStatus.COMPLETED },
                    status: client_1.PaymentStatus.PAID
                },
                select: { amount: true }
            });
            const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            // 3. Clientes nuevos (registrados este mes)
            const newCustomersCount = await prisma_1.default.customer.count({
                where: { createdAt: { gte: startOfMonth } }
            });
            // 4. Cancelaciones y No Shows totales
            const cancellationsCount = await prisma_1.default.appointment.count({
                where: { branch: { companyId }, status: client_1.AppointmentStatus.CANCELLED }
            });
            const noShowsCount = await prisma_1.default.appointment.count({
                where: { branch: { companyId }, status: client_1.AppointmentStatus.NO_SHOW }
            });
            // 5. Servicios más vendidos (Top 5)
            const serviceBookings = await prisma_1.default.appointment.groupBy({
                by: ['serviceId'],
                where: { branch: { companyId } },
                _count: { id: true }
            });
            const services = await prisma_1.default.service.findMany({ where: { companyId } });
            const topServices = serviceBookings.map(sb => {
                const service = services.find(s => s.id === sb.serviceId);
                return {
                    name: service ? service.name : 'Desconocido',
                    bookings: sb._count.id
                };
            }).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
            // 6. Horas pico (Agrupado por startTime)
            const hourBookings = await prisma_1.default.appointment.groupBy({
                by: ['startTime'],
                where: { branch: { companyId } },
                _count: { id: true }
            });
            const peakHours = hourBookings.map(hb => ({
                time: hb.startTime,
                count: hb._count.id
            })).sort((a, b) => b.count - a.count).slice(0, 5);
            // 7. Gráfico de Tendencia: Turnos en los últimos 7 días
            const last7DaysData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const cleanD = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
                const count = await prisma_1.default.appointment.count({
                    where: {
                        branch: { companyId },
                        date: cleanD,
                        status: { not: client_1.AppointmentStatus.CANCELLED }
                    }
                });
                last7DaysData.push({
                    date: cleanD.toISOString().split('T')[0],
                    turnos: count
                });
            }
            return res.status(200).json({
                status: 'success',
                data: {
                    todayAppointmentsCount: dayAppointments.length,
                    todayAppointments: dayAppointments.map(a => ({
                        id: a.id,
                        time: `${a.startTime} - ${a.endTime}`,
                        customer: `${a.customer.user.name} ${a.customer.user.lastname}`,
                        service: a.service.name,
                        employee: `${a.employee.user.name} ${a.employee.user.lastname}`,
                        status: a.status
                    })),
                    totalRevenue,
                    newCustomersCount,
                    cancellationsCount,
                    noShowsCount,
                    topServices,
                    peakHours,
                    last7DaysTrend: last7DaysData
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
