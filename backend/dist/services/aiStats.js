"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIStatsService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
class AIStatsService {
    // Helper para normalizar la fecha a las 00:00:00.000 UTC
    static parseCleanDate(date) {
        const clean = new Date(date);
        clean.setUTCHours(0, 0, 0, 0);
        return clean;
    }
    // Genera un rango de slots de tiempo de HH:MM a HH:MM incrementando en X minutos
    static generateTimeSlots(start, end, intervalMinutes) {
        const slots = [];
        let [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        for (let time = startTotal; time < endTotal; time += intervalMinutes) {
            const h = Math.floor(time / 60);
            const m = time % 60;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
        return slots;
    }
    // Comprueba si un slot (startTime) se solapa con una reserva de duración X
    static isOverlap(slotStart, slotDuration, appt) {
        // Convertir todo a minutos totales desde las 00:00 para facilitar comparación
        const toMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const sStart = toMins(slotStart);
        const sEnd = sStart + slotDuration;
        const aStart = toMins(appt.startTime);
        const aEnd = toMins(appt.endTime);
        // Hay solapamiento si: sStart < aEnd && sEnd > aStart
        return sStart < aEnd && sEnd > aStart;
    }
    static async getBusinessSummary(companyId) {
        const today = new Date();
        // Calcular rangos de fechas para consultas
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        // 1. Empleado que más personas atendió (Completados)
        const employeeStats = await prisma_1.default.appointment.groupBy({
            by: ['employeeId'],
            where: {
                branch: { companyId },
                status: client_1.AppointmentStatus.COMPLETED
            },
            _count: {
                id: true
            }
        });
        const employees = await prisma_1.default.employee.findMany({
            where: { branch: { companyId } },
            include: { user: true }
        });
        const employeeRank = employeeStats.map(stat => {
            const emp = employees.find(e => e.id === stat.employeeId);
            return {
                name: emp ? `${emp.user.name} ${emp.user.lastname}` : 'Profesional',
                count: stat._count.id
            };
        }).sort((a, b) => b.count - a.count);
        // 2. Servicio más solicitado
        const serviceStats = await prisma_1.default.appointment.groupBy({
            by: ['serviceId'],
            where: {
                branch: { companyId }
            },
            _count: {
                id: true
            }
        });
        const services = await prisma_1.default.service.findMany({
            where: { companyId }
        });
        const serviceRank = serviceStats.map(stat => {
            const srv = services.find(s => s.id === stat.serviceId);
            return {
                name: srv ? srv.name : 'Servicio',
                count: stat._count.id
            };
        }).sort((a, b) => b.count - a.count);
        // 3. Clientes nuevos este mes (Registrados desde el inicio del mes)
        const newCustomersCount = await prisma_1.default.customer.count({
            where: {
                createdAt: { gte: startOfMonth }
            }
        });
        // 4. Ingresos la semana pasada (últimos 7 días)
        const weeklyPayments = await prisma_1.default.payment.findMany({
            where: {
                appointment: {
                    branch: { companyId },
                    status: client_1.AppointmentStatus.COMPLETED
                },
                status: client_1.PaymentStatus.PAID,
                createdAt: { gte: oneWeekAgo }
            },
            select: { amount: true }
        });
        const weeklyRevenue = weeklyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        // 5. Calcular disponibilidad de mañana por empleado
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const cleanTomorrow = this.parseCleanDate(tomorrow);
        const dayOfWeek = cleanTomorrow.getUTCDay(); // 0 = Domingo, 1 = Lunes, etc.
        const companyConfig = await prisma_1.default.companyConfig.findUnique({
            where: { companyId }
        });
        const tomorrowAvailability = [];
        if (companyConfig) {
            const workingHoursArray = companyConfig.workingHours;
            const dayConfig = workingHoursArray.find(wh => wh.day === dayOfWeek);
            if (dayConfig && dayConfig.active) {
                // Obtener turnos de mañana
                const tomorrowAppts = await prisma_1.default.appointment.findMany({
                    where: {
                        branch: { companyId },
                        date: cleanTomorrow,
                        status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED] }
                    },
                    select: {
                        employeeId: true,
                        startTime: true,
                        endTime: true
                    }
                });
                // Para cada empleado activo en la empresa, calcular sus slots libres
                const activeEmployees = employees.filter(e => e.isActive);
                for (const emp of activeEmployees) {
                    const empAppts = tomorrowAppts.filter(a => a.employeeId === emp.id);
                    const allSlots = this.generateTimeSlots(dayConfig.start, dayConfig.end, companyConfig.minDurationMinutes);
                    // Filtrar slots ocupados
                    const freeSlots = allSlots.filter(slot => {
                        // Verificar si este slot se solapa con algún turno
                        return !empAppts.some(appt => this.isOverlap(slot, companyConfig.minDurationMinutes, appt));
                    });
                    tomorrowAvailability.push({
                        employeeName: `${emp.user.name} ${emp.user.lastname}`,
                        slots: freeSlots
                    });
                }
            }
        }
        // 6. Formatear como Markdown Context para alimentar el modelo de IA
        const formatTomorrowSlots = tomorrowAvailability.map(ea => `- **${ea.employeeName}**: ${ea.slots.length > 0 ? ea.slots.join(', ') : 'Sin horarios disponibles'}`).join('\n');
        const formatEmployeeRank = employeeRank.map(er => `- **${er.name}**: ${er.count} turnos atendidos`).join('\n') || '- No hay turnos completados todavía.';
        const formatServiceRank = serviceRank.map(sr => `- **${sr.name}**: solicitado ${sr.count} veces`).join('\n') || '- No hay reservas registradas.';
        const contextMarkdown = `
# ESTADÍSTICAS Y AGENDA DEL NEGOCIO

## Disponibilidad para Mañana (${tomorrow.toISOString().split('T')[0]})
${formatTomorrowSlots || 'El negocio estará cerrado mañana.'}

## Clasificación de Empleados (por turnos completados)
${formatEmployeeRank}

## Servicios más Solicitados
${formatServiceRank}

## Métricas Financieras y de Clientes
- **Ingresos de la semana pasada (últimos 7 días)**: $${weeklyRevenue.toFixed(2)} ARS (sólo cobros confirmados)
- **Clientes nuevos registrados este mes**: ${newCustomersCount} clientes nuevos
`;
        return {
            raw: {
                employeeRank,
                serviceRank,
                newCustomersCount,
                weeklyRevenue,
                tomorrowAvailability
            },
            contextMarkdown
        };
    }
}
exports.AIStatsService = AIStatsService;
