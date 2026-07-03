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
exports.EmployeeService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt = __importStar(require("bcryptjs"));
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
class EmployeeService {
    static async getEmployees(companyId) {
        return prisma_1.default.employee.findMany({
            where: {
                branch: { companyId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                },
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                                color: true
                            }
                        }
                    }
                }
            }
        });
    }
    static async getEmployeeById(employeeId, companyId) {
        const employee = await prisma_1.default.employee.findFirst({
            where: {
                id: employeeId,
                branch: { companyId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                },
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                services: {
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!employee) {
            throw new errors_1.NotFoundError('Empleado no encontrado');
        }
        return employee;
    }
    static async createEmployee(companyId, data) {
        // 1. Validar que la sucursal pertenezca a la empresa
        const branch = await prisma_1.default.branch.findFirst({
            where: { id: data.branchId, companyId }
        });
        if (!branch) {
            throw new errors_1.BadRequestError('La sucursal seleccionada no pertenece a la empresa');
        }
        // 2. Validar que el email no esté tomado
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new errors_1.ConflictError('El correo electrónico ya está registrado');
        }
        // 3. Encriptar contraseña del empleado
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.passwordHash, salt);
        return prisma_1.default.$transaction(async (tx) => {
            // 4. Crear el Usuario
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    lastname: data.lastname,
                    role: client_1.Role.EMPLOYEE
                }
            });
            // 5. Crear Perfil de Empleado
            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    branchId: data.branchId,
                    isActive: true
                }
            });
            // 6. Asociar Servicios
            if (data.serviceIds && data.serviceIds.length > 0) {
                const relations = data.serviceIds.map(serviceId => ({
                    employeeId: employee.id,
                    serviceId
                }));
                await tx.employeeService.createMany({
                    data: relations
                });
            }
            return employee;
        });
    }
    static async updateEmployee(employeeId, companyId, data) {
        // Verificar que el empleado existe y pertenece a la empresa
        const employee = await prisma_1.default.employee.findFirst({
            where: {
                id: employeeId,
                branch: { companyId }
            }
        });
        if (!employee) {
            throw new errors_1.NotFoundError('Empleado no encontrado');
        }
        // Si viene branchId, validar que pertenece a la empresa
        if (data.branchId) {
            const branch = await prisma_1.default.branch.findFirst({
                where: { id: data.branchId, companyId }
            });
            if (!branch) {
                throw new errors_1.BadRequestError('La sucursal seleccionada no pertenece a la empresa');
            }
        }
        return prisma_1.default.$transaction(async (tx) => {
            // 1. Actualizar datos de Usuario (Nombre, Apellido)
            if (data.name || data.lastname) {
                await tx.user.update({
                    where: { id: employee.userId },
                    data: {
                        name: data.name,
                        lastname: data.lastname
                    }
                });
            }
            // 2. Actualizar datos de Empleado (Sucursal, Estado Activo)
            await tx.employee.update({
                where: { id: employeeId },
                data: {
                    branchId: data.branchId || undefined,
                    isActive: data.isActive !== undefined ? data.isActive : undefined
                }
            });
            // 3. Actualizar Servicios asignados
            if (data.serviceIds !== undefined) {
                // Borrar anteriores
                await tx.employeeService.deleteMany({
                    where: { employeeId }
                });
                // Crear nuevas relaciones
                if (data.serviceIds.length > 0) {
                    const relations = data.serviceIds.map(serviceId => ({
                        employeeId,
                        serviceId
                    }));
                    await tx.employeeService.createMany({
                        data: relations
                    });
                }
            }
            return this.getEmployeeById(employeeId, companyId);
        });
    }
    static async deleteEmployee(employeeId, companyId) {
        const employee = await prisma_1.default.employee.findFirst({
            where: {
                id: employeeId,
                branch: { companyId }
            }
        });
        if (!employee) {
            throw new errors_1.NotFoundError('Empleado no encontrado');
        }
        // Verificar si tiene turnos activos
        const appointmentsCount = await prisma_1.default.appointment.count({
            where: {
                employeeId,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });
        if (appointmentsCount > 0) {
            // Borrado lógico para mantener historial e integridad
            return prisma_1.default.employee.update({
                where: { id: employeeId },
                data: { isActive: false }
            });
        }
        // Si no tiene turnos activos, borrado físico en cascada
        return prisma_1.default.$transaction(async (tx) => {
            await tx.employeeService.deleteMany({
                where: { employeeId }
            });
            await tx.employee.delete({
                where: { id: employeeId }
            });
            return tx.user.delete({
                where: { id: employee.userId }
            });
        });
    }
}
exports.EmployeeService = EmployeeService;
