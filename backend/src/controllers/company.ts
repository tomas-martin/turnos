import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company';
import { ForbiddenError } from '../utils/errors';

export class CompanyController {
  private static async getCompanyIdFromUser(req: Request) {
    if (!req.user) {
      throw new ForbiddenError('Usuario no autenticado');
    }
    const company = await CompanyService.getCompanyForUser({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    return company.id;
  }

  static async getMyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }
      const company = await CompanyService.getCompanyForUser({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      });
      return res.status(200).json({
        status: 'success',
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllPublicCompanies(_req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await CompanyService.getAllCompanies();
      return res.status(200).json({
        status: 'success',
        data: companies
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const company = await CompanyService.getPublicCompanyDetails(companyId);
      return res.status(200).json({
        status: 'success',
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CompanyController.getCompanyIdFromUser(req);
      const updated = await CompanyService.updateCompany(companyId, req.body);
      return res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyCompanyConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CompanyController.getCompanyIdFromUser(req);
      const updated = await CompanyService.updateCompanyConfig(companyId, req.body);
      return res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CompanyController.getCompanyIdFromUser(req);
      const branches = await CompanyService.getBranches(companyId);
      return res.status(200).json({
        status: 'success',
        data: branches
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMyBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CompanyController.getCompanyIdFromUser(req);
      const branch = await CompanyService.createBranch(companyId, req.body);
      return res.status(201).json({
        status: 'success',
        data: branch
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CompanyController.getCompanyIdFromUser(req);
      const { branchId } = req.params;
      const updated = await CompanyService.updateBranch(branchId, companyId, req.body);
      return res.status(200).json({
        status: 'success',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMyBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CompanyController.getCompanyIdFromUser(req);
      const { branchId } = req.params;
      await CompanyService.deleteBranch(branchId, companyId);
      return res.status(200).json({
        status: 'success',
        message: 'Sucursal eliminada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
