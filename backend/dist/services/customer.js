"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt = __importStar(require("bcryptjs"));
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
class CustomerService {
    static async getCustomers(companyId) {
        // 1. Obtener los clientes que tienen turnos en esta empresa, o que están registrados en la DB
        // Para simplificar, buscamos los clientes que tienen al menos un turno en la empresa, 
        // y también incluimos a todos los clientes registrados para que el admin los pueda ver.
        const customers = await prisma_1.default.customer.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                },
                appointments: {
                    where: {
                        branch: { companyId }
                    },
                    include: {
                        payment: true
                    }
                }
            }
        });
        const today = new Date();
        // 2. Mapear y calcular las estadísticas para cada cliente
        return customers.map(cust => {
            const appointments = cust.appointments || [];
            const totalAppointments = appointments.length;
            // Calcular monto gastado en turnos COMPLETED que tengan pago PAID
            const amountSpent = appointments
                .filter(a => a.status === client_1.AppointmentStatus.COMPLETED && a.payment && a.payment.status === client_1.PaymentStatus.PAID)
                .reduce((sum, a) => sum + Number(a.payment?.amount || 0), 0);
            // Buscar el próximo turno confirmado
            // Filtramos turnos del día de hoy en adelante, ordenados por fecha ascendente
            const upcomingAppointments = appointments
                .filter(a => {
                const appointmentDate = new Date(a.date);
                // Comparar solo fechas
                return appointmentDate >= new Date(today.setHours(0, 0, 0, 0)) &&
                    ['PENDING', 'CONFIRMED'].includes(a.status);
            })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const nextAppointment = upcomingAppointments.length > 0 ? {
                id: upcomingAppointments[0].id,
                date: upcomingAppointments[0].date,
                startTime: upcomingAppointments[0].startTime,
                status: upcomingAppointments[0].status
            } : null;
            return {
                id: cust.id,
                userId: cust.userId,
                name: cust.user.name,
                lastname: cust.user.lastname,
                email: cust.user.email,
                dni: cust.dni,
                phone: cust.phone,
                address: cust.address,
                observations: cust.observations,
                totalAppointments,
                amountSpent,
                nextAppointment,
                createdAt: cust.createdAt
            };
        });
    }
    static async getCustomerById(customerId, companyId) {
        const customer = await prisma_1.default.customer.findFirst({
            where: { id: customerId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                },
                appointments: {
                    where: {
                        branch: { companyId }
                    },
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                duration: true
                            }
                        },
                        employee: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        lastname: true
                                    }
                                }
                            }
                        },
                        payment: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });
        if (!customer) {
            throw new errors_1.NotFoundError('Cliente no encontrado');
        }
        const appointments = customer.appointments || [];
        const totalAppointments = appointments.length;
        const amountSpent = appointments
            .filter(a => a.status === client_1.AppointmentStatus.COMPLETED && a.payment && a.payment.status === client_1.PaymentStatus.PAID)
            .reduce((sum, a) => sum + Number(a.payment?.amount || 0), 0);
        return {
            id: customer.id,
            userId: customer.userId,
            name: customer.user.name,
            lastname: customer.user.lastname,
            email: customer.user.email,
            dni: customer.dni,
            phone: customer.phone,
            address: customer.address,
            observations: customer.observations,
            totalAppointments,
            amountSpent,
            appointments: appointments.map(a => ({
                id: a.id,
                service: a.service.name,
                employee: `${a.employee.user.name} ${a.employee.user.lastname}`,
                date: a.date,
                startTime: a.startTime,
                endTime: a.endTime,
                status: a.status,
                paymentStatus: a.payment?.status || 'PENDING',
                paymentMethod: a.payment?.method || null,
                notes: a.notes
            })),
            createdAt: customer.createdAt
        };
    }
    static async createCustomer(_companyId, data) {
        // Validar si ya existe el usuario
        const existing = await prisma_1.default.user.findUnique({
            where: { email: data.email }
        });
        if (existing) {
            throw new errors_1.ConflictError('El correo electrónico ya está registrado.');
        }
        // Para clientes creados manualmente por el admin (teléfono/walk-in),
        // creamos una contraseña aleatoria inicial que luego pueden resetear.
        const tempPassword = Math.random().toString(36).substring(2, 10);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
        return prisma_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    lastname: data.lastname,
                    role: client_1.Role.CUSTOMER
                }
            });
            const customer = await tx.customer.create({
                data: {
                    userId: user.id,
                    dni: data.dni,
                    phone: data.phone,
                    address: data.address,
                    observations: data.observations
                }
            });
            return {
                id: customer.id,
                userId: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                dni: customer.dni,
                phone: customer.phone
            };
        });
    }
    static async updateCustomer(customerId, companyId, data) {
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: customerId }
        });
        if (!customer) {
            throw new errors_1.NotFoundError('Cliente no encontrado');
        }
        return prisma_1.default.$transaction(async (tx) => {
            // 1. Actualizar usuario (Nombre, Apellido)
            if (data.name || data.lastname) {
                await tx.user.update({
                    where: { id: customer.userId },
                    data: {
                        name: data.name,
                        lastname: data.lastname
                    }
                });
            }
            // 2. Actualizar perfil de cliente
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    dni: data.dni !== undefined ? data.dni : undefined,
                    phone: data.phone !== undefined ? data.phone : undefined,
                    address: data.address !== undefined ? data.address : undefined,
                    observations: data.observations !== undefined ? data.observations : undefined
                }
            });
            return this.getCustomerById(customerId, companyId);
        });
    }
    static async deleteCustomer(customerId) {
        const customer = await prisma_1.default.customer.findUnique({
            where: { id: customerId }
        });
        if (!customer) {
            throw new errors_1.NotFoundError('Cliente no encontrado');
        }
        // Validar si tiene turnos futuros confirmados
        const activeAppointments = await prisma_1.default.appointment.count({
            where: {
                customerId,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });
        if (activeAppointments > 0) {
            throw new errors_1.BadRequestError('No se puede eliminar el cliente porque tiene turnos futuros pendientes o confirmados.');
        }
        // Borrado físico
        return prisma_1.default.$transaction(async (tx) => {
            await tx.customer.delete({
                where: { id: customerId }
            });
            return tx.user.delete({
                where: { id: customer.userId }
            });
        });
    }
}
exports.CustomerService = CustomerService;
