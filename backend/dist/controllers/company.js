"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
class CompanyController {
    static async getCompanyIdFromUser(req) {
        if (!req.user) {
            throw new errors_1.ForbiddenError('Usuario no autenticado');
        }
        const company = await company_1.CompanyService.getCompanyForUser({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        });
        return company.id;
    }
    static async getMyCompany(req, res, next) {
        try {
            if (!req.user) {
                throw new errors_1.ForbiddenError('Usuario no autenticado');
            }
            const company = await company_1.CompanyService.getCompanyForUser({
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            });
            return res.status(200).json({
                status: 'success',
                data: company
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllPublicCompanies(_req, res, next) {
        try {
            const companies = await company_1.CompanyService.getAllCompanies();
            return res.status(200).json({
                status: 'success',
                data: companies
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPublicCompany(req, res, next) {
        try {
            const { companyId } = req.params;
            const company = await company_1.CompanyService.getPublicCompanyDetails(companyId);
            return res.status(200).json({
                status: 'success',
                data: company
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMyCompany(req, res, next) {
        try {
            const companyId = await CompanyController.getCompanyIdFromUser(req);
            const updated = await company_1.CompanyService.updateCompany(companyId, req.body);
            return res.status(200).json({
                status: 'success',
                data: updated
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMyCompanyConfig(req, res, next) {
        try {
            const companyId = await CompanyController.getCompanyIdFromUser(req);
            const updated = await company_1.CompanyService.updateCompanyConfig(companyId, req.body);
            return res.status(200).json({
                status: 'success',
                data: updated
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getMyBranches(req, res, next) {
        try {
            const companyId = await CompanyController.getCompanyIdFromUser(req);
            const branches = await company_1.CompanyService.getBranches(companyId);
            return res.status(200).json({
                status: 'success',
                data: branches
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createMyBranch(req, res, next) {
        try {
            const companyId = await CompanyController.getCompanyIdFromUser(req);
            const branch = await company_1.CompanyService.createBranch(companyId, req.body);
            return res.status(201).json({
                status: 'success',
                data: branch
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMyBranch(req, res, next) {
        try {
            const companyId = await CompanyController.getCompanyIdFromUser(req);
            const { branchId } = req.params;
            const updated = await company_1.CompanyService.updateBranch(branchId, companyId, req.body);
            return res.status(200).json({
                status: 'success',
                data: updated
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteMyBranch(req, res, next) {
        try {
            const companyId = await CompanyController.getCompanyIdFromUser(req);
            const { branchId } = req.params;
            await company_1.CompanyService.deleteBranch(branchId, companyId);
            return res.status(200).json({
                status: 'success',
                message: 'Sucursal eliminada correctamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CompanyController = CompanyController;
