"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const service_1 = require("../services/service");
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
class ServiceController {
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
    static async getServices(req, res, next) {
        try {
            let companyId;
            if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'EMPLOYEE')) {
                companyId = await ServiceController.getCompanyIdFromUser(req);
            }
            else {
                companyId = req.query.companyId;
                if (!companyId) {
                    throw new errors_1.BadRequestError('Falta especificar el companyId en la consulta');
                }
            }
            const includeInactive = req.query.includeInactive === 'true';
            const services = await service_1.ServiceService.getServices(companyId, includeInactive);
            return res.status(200).json({
                status: 'success',
                data: services
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getServiceById(req, res, next) {
        try {
            const companyId = await ServiceController.getCompanyIdFromUser(req);
            const { serviceId } = req.params;
            const service = await service_1.ServiceService.getServiceById(serviceId, companyId);
            return res.status(200).json({
                status: 'success',
                data: service
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createService(req, res, next) {
        try {
            const companyId = await ServiceController.getCompanyIdFromUser(req);
            const service = await service_1.ServiceService.createService(companyId, req.body);
            return res.status(201).json({
                status: 'success',
                data: service
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateService(req, res, next) {
        try {
            const companyId = await ServiceController.getCompanyIdFromUser(req);
            const { serviceId } = req.params;
            const service = await service_1.ServiceService.updateService(serviceId, companyId, req.body);
            return res.status(200).json({
                status: 'success',
                data: service
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteService(req, res, next) {
        try {
            const companyId = await ServiceController.getCompanyIdFromUser(req);
            const { serviceId } = req.params;
            await service_1.ServiceService.deleteService(serviceId, companyId);
            return res.status(200).json({
                status: 'success',
                message: 'Servicio eliminado correctamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ServiceController = ServiceController;
