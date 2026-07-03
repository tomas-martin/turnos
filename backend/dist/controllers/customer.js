"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const customer_1 = require("../services/customer");
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
const prisma_1 = __importDefault(require("../config/prisma"));
class CustomerController {
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
    static async getCustomers(req, res, next) {
        try {
            // Solo Admin y Empleado pueden listar todos los clientes
            if (req.user?.role === 'CUSTOMER') {
                throw new errors_1.ForbiddenError('No tienes permisos para ver el listado de clientes.');
            }
            const companyId = await CustomerController.getCompanyIdFromUser(req);
            const customers = await customer_1.CustomerService.getCustomers(companyId);
            return res.status(200).json({
                status: 'success',
                data: customers
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCustomerById(req, res, next) {
        try {
            const companyId = await CustomerController.getCompanyIdFromUser(req);
            const { customerId } = req.params;
            // Un cliente no puede ver los detalles de otro cliente
            if (req.user?.role === 'CUSTOMER') {
                const checkOwn = await prisma_1.default.customer.findUnique({
                    where: { id: customerId }
                });
                if (checkOwn?.userId !== req.user.id) {
                    throw new errors_1.ForbiddenError('No tienes permisos para ver este perfil.');
                }
            }
            const customer = await customer_1.CustomerService.getCustomerById(customerId, companyId);
            return res.status(200).json({
                status: 'success',
                data: customer
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getMyCustomerProfile(req, res, next) {
        try {
            if (!req.user || req.user.role !== 'CUSTOMER') {
                throw new errors_1.BadRequestError('Esta ruta es exclusiva para clientes.');
            }
            const companyId = req.query.companyId; // opcional para ver historial en esa empresa
            if (!companyId) {
                throw new errors_1.BadRequestError('Falta especificar el companyId');
            }
            // Buscar perfil de cliente a partir del userId de la sesión
            const customerProfile = await prisma_1.default.customer.findUnique({
                where: { userId: req.user.id }
            });
            if (!customerProfile) {
                throw new errors_1.NotFoundError('Perfil de cliente no encontrado');
            }
            const customer = await customer_1.CustomerService.getCustomerById(customerProfile.id, companyId);
            return res.status(200).json({
                status: 'success',
                data: customer
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createCustomer(req, res, next) {
        try {
            if (req.user?.role === 'CUSTOMER') {
                throw new errors_1.ForbiddenError('Solo administradores o empleados pueden registrar clientes manualmente.');
            }
            const companyId = await CustomerController.getCompanyIdFromUser(req);
            const customer = await customer_1.CustomerService.createCustomer(companyId, req.body);
            return res.status(201).json({
                status: 'success',
                data: customer
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateCustomer(req, res, next) {
        try {
            const companyId = await CustomerController.getCompanyIdFromUser(req);
            const { customerId } = req.params;
            // Validar propiedad del perfil si es un cliente editándose a sí mismo
            if (req.user?.role === 'CUSTOMER') {
                const checkOwn = await prisma_1.default.customer.findUnique({
                    where: { id: customerId }
                });
                if (checkOwn?.userId !== req.user.id) {
                    throw new errors_1.ForbiddenError('No tienes permisos para modificar este perfil.');
                }
            }
            const customer = await customer_1.CustomerService.updateCustomer(customerId, companyId, req.body);
            return res.status(200).json({
                status: 'success',
                data: customer
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteCustomer(req, res, next) {
        try {
            if (req.user?.role === 'CUSTOMER') {
                throw new errors_1.ForbiddenError('Solo administradores pueden eliminar cuentas de clientes.');
            }
            const { customerId } = req.params;
            await customer_1.CustomerService.deleteCustomer(customerId);
            return res.status(200).json({
                status: 'success',
                message: 'Cliente eliminado correctamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
