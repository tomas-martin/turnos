import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report';
import { CompanyService } from '../services/company';
import { BadRequestError } from '../utils/errors';

export class ReportController {
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

  static async downloadCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ReportController.getCompanyIdFromUser(req);
      const csv = await ReportService.generateCSV(companyId, req.query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte-turnos.csv');
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async downloadExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ReportController.getCompanyIdFromUser(req);
      const buffer = await ReportService.generateExcel(companyId, req.query);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte-turnos.xlsx');
      return res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async downloadPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ReportController.getCompanyIdFromUser(req);
      const buffer = await ReportService.generatePDF(companyId, req.query);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte-turnos.pdf');
      return res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
