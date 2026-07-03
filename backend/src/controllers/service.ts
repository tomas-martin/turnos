import { Request, Response, NextFunction } from 'express';
import { ServiceService } from '../services/service';
import { CompanyService } from '../services/company';
import { BadRequestError } from '../utils/errors';

export class ServiceController {
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

  static async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      let companyId: string;

      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'EMPLOYEE')) {
        companyId = await ServiceController.getCompanyIdFromUser(req);
      } else {
        companyId = req.query.companyId as string;
        if (!companyId) {
          throw new BadRequestError('Falta especificar el companyId en la consulta');
        }
      }

      const includeInactive = req.query.includeInactive === 'true';
      const services = await ServiceService.getServices(companyId, includeInactive);

      return res.status(200).json({
        status: 'success',
        data: services
      });
    } catch (error) {
      next(error);
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ServiceController.getCompanyIdFromUser(req);
      const { serviceId } = req.params;
      const service = await ServiceService.getServiceById(serviceId, companyId);
      
      return res.status(200).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  static async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ServiceController.getCompanyIdFromUser(req);
      const service = await ServiceService.createService(companyId, req.body);
      
      return res.status(201).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ServiceController.getCompanyIdFromUser(req);
      const { serviceId } = req.params;
      const service = await ServiceService.updateService(serviceId, companyId, req.body);
      
      return res.status(200).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await ServiceController.getCompanyIdFromUser(req);
      const { serviceId } = req.params;
      await ServiceService.deleteService(serviceId, companyId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Servicio eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
