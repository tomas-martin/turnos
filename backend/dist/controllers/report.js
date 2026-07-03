"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_1 = require("../services/report");
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
class ReportController {
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
    static async downloadCSV(req, res, next) {
        try {
            const companyId = await ReportController.getCompanyIdFromUser(req);
            const csv = await report_1.ReportService.generateCSV(companyId, req.query);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte-turnos.csv');
            return res.status(200).send(csv);
        }
        catch (error) {
            next(error);
        }
    }
    static async downloadExcel(req, res, next) {
        try {
            const companyId = await ReportController.getCompanyIdFromUser(req);
            const buffer = await report_1.ReportService.generateExcel(companyId, req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte-turnos.xlsx');
            return res.status(200).send(buffer);
        }
        catch (error) {
            next(error);
        }
    }
    static async downloadPDF(req, res, next) {
        try {
            const companyId = await ReportController.getCompanyIdFromUser(req);
            const buffer = await report_1.ReportService.generatePDF(companyId, req.query);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=reporte-turnos.pdf');
            return res.status(200).send(buffer);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
