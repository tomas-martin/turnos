"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errors_1 = require("../utils/errors");
class ServiceService {
    static async getServices(companyId, includeInactive = false) {
        return prisma_1.default.service.findMany({
            where: {
                companyId,
                ...(includeInactive ? {} : { isActive: true })
            },
            include: {
                employees: {
                    include: {
                        employee: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        lastname: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    static async getServiceById(serviceId, companyId) {
        const service = await prisma_1.default.service.findFirst({
            where: { id: serviceId, companyId },
            include: {
                employees: {
                    include: {
                        employee: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        lastname: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!service) {
            throw new errors_1.NotFoundError('Servicio no encontrado');
        }
        return service;
    }
    static async createService(companyId, data) {
        return prisma_1.default.$transaction(async (tx) => {
            // 1. Crear el servicio
            const service = await tx.service.create({
                data: {
                    companyId,
                    name: data.name,
                    description: data.description,
                    duration: data.duration,
                    price: data.price,
                    color: data.color,
                    category: data.category
                }
            });
            // 2. Asociar los empleados si vienen especificados
            if (data.employeeIds && data.employeeIds.length > 0) {
                const relations = data.employeeIds.map(empId => ({
                    employeeId: empId,
                    serviceId: service.id
                }));
                await tx.employeeService.createMany({
                    data: relations
                });
            }
            return this.getServiceById(service.id, companyId);
        });
    }
    static async updateService(serviceId, companyId, data) {
        // Verificar existencia
        const existing = await prisma_1.default.service.findFirst({
            where: { id: serviceId, companyId }
        });
        if (!existing) {
            throw new errors_1.NotFoundError('Servicio no encontrado');
        }
        return prisma_1.default.$transaction(async (tx) => {
            // 1. Actualizar campos del servicio
            const { employeeIds, ...serviceData } = data;
            await tx.service.update({
                where: { id: serviceId },
                data: serviceData
            });
            // 2. Si se provee lista de empleados, actualizar relaciones
            if (employeeIds !== undefined) {
                // Borrar anteriores
                await tx.employeeService.deleteMany({
                    where: { serviceId }
                });
                // Crear nuevas
                if (employeeIds.length > 0) {
                    const relations = employeeIds.map(empId => ({
                        employeeId: empId,
                        serviceId
                    }));
                    await tx.employeeService.createMany({
                        data: relations
                    });
                }
            }
            return this.getServiceById(serviceId, companyId);
        });
    }
    static async deleteService(serviceId, companyId) {
        const service = await prisma_1.default.service.findFirst({
            where: { id: serviceId, companyId }
        });
        if (!service) {
            throw new errors_1.NotFoundError('Servicio no encontrado');
        }
        // Verificar si el servicio tiene turnos asociados
        const appointmentsCount = await prisma_1.default.appointment.count({
            where: { serviceId }
        });
        if (appointmentsCount > 0) {
            // Si tiene turnos, realizamos un borrado lógico para no romper integridad referencial
            return prisma_1.default.service.update({
                where: { id: serviceId },
                data: { isActive: false }
            });
        }
        // Si no tiene turnos, borrado físico de relaciones y del servicio
        return prisma_1.default.$transaction(async (tx) => {
            await tx.employeeService.deleteMany({
                where: { serviceId }
            });
            return tx.service.delete({
                where: { id: serviceId }
            });
        });
    }
}
exports.ServiceService = ServiceService;
