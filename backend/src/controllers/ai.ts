import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai';
import { CompanyService } from '../services/company';
import { BadRequestError } from '../utils/errors';

export class AIController {
  private static async getCompanyIdFromUser(req: Request) {
    if (!req.user) {
      throw new BadRequestError('Usuario no autenticado');
    }
    const company = await CompanyService.getCompanyForUser({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    return company.id;
  }

  static async queryBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await AIController.getCompanyIdFromUser(req);
      const { question } = req.body;

      const answer = await AIService.queryAI(companyId, question);

      return res.status(200).json({
        status: 'success',
        data: {
          answer
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
