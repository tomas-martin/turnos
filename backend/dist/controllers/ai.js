"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const ai_1 = require("../services/ai");
const company_1 = require("../services/company");
const errors_1 = require("../utils/errors");
class AIController {
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
    static async queryBusiness(req, res, next) {
        try {
            const companyId = await AIController.getCompanyIdFromUser(req);
            const { question } = req.body;
            const answer = await ai_1.AIService.queryAI(companyId, question);
            return res.status(200).json({
                status: 'success',
                data: {
                    answer
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AIController = AIController;
