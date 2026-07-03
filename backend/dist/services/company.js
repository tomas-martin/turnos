"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errors_1 = require("../utils/errors");
class CompanyService {
    static async getCompanyForUser(user) {
        let company = null;
        if (user.role === 'ADMIN') {
            company = await prisma_1.default.company.findFirst({
                where: { email: user.email },
                include: { config: true, branches: true }
            });
        }
        else if (user.role === 'EMPLOYEE') {
            const employee = await prisma_1.default.employee.findUnique({
                where: { userId: user.id },
                include: {
                    branch: {
                        include: {
                            company: {
                                include: { config: true, branches: true }
                            }
                        }
                    }
                }
            });
            company = employee?.branch?.company || null;
        }
        if (!company) {
            throw new errors_1.NotFoundError('Empresa no encontrada para el usuario actual');
        }
        return company;
    }
    static async getAllCompanies() {
        return prisma_1.default.company.findMany();
    }
    // Permite obtener datos públicos de la empresa (para clientes que van a reservar)
    static async getPublicCompanyDetails(companyId) {
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            include: {
                config: true,
                branches: true,
                services: {
                    where: { isActive: true }
                }
            }
        });
        if (!company) {
            throw new errors_1.NotFoundError('Empresa no encontrada');
        }
        return company;
    }
    static async updateCompany(companyId, data) {
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId }
        });
        if (!company) {
            throw new errors_1.NotFoundError('Empresa no encontrada');
        }
        return prisma_1.default.company.update({
            where: { id: companyId },
            data
        });
    }
    static async updateCompanyConfig(companyId, data) {
        const config = await prisma_1.default.companyConfig.findUnique({
            where: { companyId }
        });
        if (!config) {
            throw new errors_1.NotFoundError('Configuración de empresa no encontrada');
        }
        return prisma_1.default.companyConfig.update({
            where: { companyId },
            data
        });
    }
    static async getBranches(companyId) {
        return prisma_1.default.branch.findMany({
            where: { companyId }
        });
    }
    static async createBranch(companyId, data) {
        return prisma_1.default.branch.create({
            data: {
                companyId,
                name: data.name,
                address: data.address,
                phone: data.phone
            }
        });
    }
    static async updateBranch(branchId, companyId, data) {
        const branch = await prisma_1.default.branch.findFirst({
            where: { id: branchId, companyId }
        });
        if (!branch) {
            throw new errors_1.NotFoundError('Sucursal no encontrada en esta empresa');
        }
        return prisma_1.default.branch.update({
            where: { id: branchId },
            data
        });
    }
    static async deleteBranch(branchId, companyId) {
        const branch = await prisma_1.default.branch.findFirst({
            where: { id: branchId, companyId }
        });
        if (!branch) {
            throw new errors_1.NotFoundError('Sucursal no encontrada en esta empresa');
        }
        // Verificar si hay empleados o turnos asignados a la sucursal antes de borrar
        const activeEmployees = await prisma_1.default.employee.count({
            where: { branchId }
        });
        const activeAppointments = await prisma_1.default.appointment.count({
            where: { branchId, status: { in: ['PENDING', 'CONFIRMED'] } }
        });
        if (activeEmployees > 0 || activeAppointments > 0) {
            throw new errors_1.BadRequestError('No se puede eliminar la sucursal porque tiene empleados o turnos activos asignados.');
        }
        return prisma_1.default.branch.delete({
            where: { id: branchId }
        });
    }
}
exports.CompanyService = CompanyService;
