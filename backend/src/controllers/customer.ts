import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer';
import { CompanyService } from '../services/company';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import prisma from '../config/prisma';

export class CustomerController {
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

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      // Solo Admin y Empleado pueden listar todos los clientes
      if (req.user?.role === 'CUSTOMER') {
        throw new ForbiddenError('No tienes permisos para ver el listado de clientes.');
      }

      const companyId = await CustomerController.getCompanyIdFromUser(req);
      const customers = await CustomerService.getCustomers(companyId);
      
      return res.status(200).json({
        status: 'success',
        data: customers
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CustomerController.getCompanyIdFromUser(req);
      const { customerId } = req.params;

      // Un cliente no puede ver los detalles de otro cliente
      if (req.user?.role === 'CUSTOMER') {
        const checkOwn = await prisma.customer.findUnique({
          where: { id: customerId }
        });
        if (checkOwn?.userId !== req.user.id) {
          throw new ForbiddenError('No tienes permisos para ver este perfil.');
        }
      }

      const customer = await CustomerService.getCustomerById(customerId, companyId);
      
      return res.status(200).json({
        status: 'success',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyCustomerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'CUSTOMER') {
        throw new BadRequestError('Esta ruta es exclusiva para clientes.');
      }

      const companyId = req.query.companyId as string; // opcional para ver historial en esa empresa
      if (!companyId) {
        throw new BadRequestError('Falta especificar el companyId');
      }

      // Buscar perfil de cliente a partir del userId de la sesión
      const customerProfile = await prisma.customer.findUnique({
        where: { userId: req.user.id }
      });

      if (!customerProfile) {
        throw new NotFoundError('Perfil de cliente no encontrado');
      }

      const customer = await CustomerService.getCustomerById(customerProfile.id, companyId);
      
      return res.status(200).json({
        status: 'success',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === 'CUSTOMER') {
        throw new ForbiddenError('Solo administradores o empleados pueden registrar clientes manualmente.');
      }

      const companyId = await CustomerController.getCompanyIdFromUser(req);
      const customer = await CustomerService.createCustomer(companyId, req.body);
      
      return res.status(201).json({
        status: 'success',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await CustomerController.getCompanyIdFromUser(req);
      const { customerId } = req.params;

      // Validar propiedad del perfil si es un cliente editándose a sí mismo
      if (req.user?.role === 'CUSTOMER') {
        const checkOwn = await prisma.customer.findUnique({
          where: { id: customerId }
        });
        if (checkOwn?.userId !== req.user.id) {
          throw new ForbiddenError('No tienes permisos para modificar este perfil.');
        }
      }

      const customer = await CustomerService.updateCustomer(customerId, companyId, req.body);
      
      return res.status(200).json({
        status: 'success',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === 'CUSTOMER') {
        throw new ForbiddenError('Solo administradores pueden eliminar cuentas de clientes.');
      }

      const { customerId } = req.params;
      await CustomerService.deleteCustomer(customerId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Cliente eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}
