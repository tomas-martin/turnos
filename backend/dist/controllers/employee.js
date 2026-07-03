"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const employee_1 = require("../services/employee");
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
class EmployeeController {
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
    static async getEmployees(req, res, next) {
        try {
            const companyId = await EmployeeController.getCompanyIdFromUser(req);
            const employees = await employee_1.EmployeeService.getEmployees(companyId);
            return res.status(200).json({
                status: 'success',
                data: employees
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getEmployeeById(req, res, next) {
        try {
            const companyId = await EmployeeController.getCompanyIdFromUser(req);
            const { employeeId } = req.params;
            const employee = await employee_1.EmployeeService.getEmployeeById(employeeId, companyId);
            return res.status(200).json({
                status: 'success',
                data: employee
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createEmployee(req, res, next) {
        try {
            const companyId = await EmployeeController.getCompanyIdFromUser(req);
            const employee = await employee_1.EmployeeService.createEmployee(companyId, {
                email: req.body.email,
                passwordHash: req.body.password,
                name: req.body.name,
                lastname: req.body.lastname,
                branchId: req.body.branchId,
                serviceIds: req.body.serviceIds
            });
            return res.status(201).json({
                status: 'success',
                data: employee
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateEmployee(req, res, next) {
        try {
            const companyId = await EmployeeController.getCompanyIdFromUser(req);
            const { employeeId } = req.params;
            const employee = await employee_1.EmployeeService.updateEmployee(employeeId, companyId, req.body);
            return res.status(200).json({
                status: 'success',
                data: employee
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteEmployee(req, res, next) {
        try {
            const companyId = await EmployeeController.getCompanyIdFromUser(req);
            const { employeeId } = req.params;
            await employee_1.EmployeeService.deleteEmployee(employeeId, companyId);
            return res.status(200).json({
                status: 'success',
                message: 'Empleado eliminado correctamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmployeeController = EmployeeController;
