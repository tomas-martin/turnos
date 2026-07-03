import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee';
import { CompanyService } from '../services/company';
import { BadRequestError } from '../utils/errors';

export class EmployeeController {
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

  static async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await EmployeeController.getCompanyIdFromUser(req);
      const employees = await EmployeeService.getEmployees(companyId);
      
      return res.status(200).json({
        status: 'success',
        data: employees
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await EmployeeController.getCompanyIdFromUser(req);
      const { employeeId } = req.params;
      const employee = await EmployeeService.getEmployeeById(employeeId, companyId);
      
      return res.status(200).json({
        status: 'success',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await EmployeeController.getCompanyIdFromUser(req);
      const employee = await EmployeeService.createEmployee(companyId, {
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
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await EmployeeController.getCompanyIdFromUser(req);
      const { employeeId } = req.params;
      const employee = await EmployeeService.updateEmployee(employeeId, companyId, req.body);
      
      return res.status(200).json({
        status: 'success',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await EmployeeController.getCompanyIdFromUser(req);
      const { employeeId } = req.params;
      await EmployeeService.deleteEmployee(employeeId, companyId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Empleado eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
