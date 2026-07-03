import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment';
import { CompanyService } from '../services/company';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { Role } from '@prisma/client';

export class AppointmentController {
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

  static async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.query.employeeId as string;
      const date = req.query.date as string;
      let companyId = req.query.companyId as string;

      if (!employeeId || !date) {
        throw new BadRequestError('Falta especificar el employeeId o la fecha');
      }

      if (!companyId && req.user) {
        companyId = await AppointmentController.getCompanyIdFromUser(req);
      }

      if (!companyId) {
        const employee = await prisma.employee.findUnique({
          where: { id: employeeId },
          include: { branch: true }
        });
        if (!employee) {
          throw new NotFoundError('Profesional no encontrado');
        }
        companyId = employee.branch.companyId;
      }

      const slots = await AppointmentService.getAvailableSlots(companyId, employeeId, date);

      return res.status(200).json({
        status: 'success',
        data: slots
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      let companyId: string;

      // Permitir obtener turnos si es un usuario autenticado (para admin/empleado sus turnos, para clientes sus turnos de esa empresa)
      if (req.user && (req.user.role === Role.ADMIN || req.user.role === Role.EMPLOYEE)) {
        companyId = await AppointmentController.getCompanyIdFromUser(req);
      } else {
        companyId = req.query.companyId as string;
        if (!companyId) {
          throw new BadRequestError('Falta especificar el companyId');
        }
      }

      const filters = {
        employeeId: req.query.employeeId as string,
        serviceId: req.query.serviceId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };

      const appointments = await AppointmentService.getAppointments(companyId, filters);

      // Si es un cliente, filtrar solo sus propios turnos por seguridad
      if (req.user?.role === Role.CUSTOMER) {
        const customerProfile = await prisma.customer.findUnique({
          where: { userId: req.user.id }
        });
        const filtered = appointments.filter(a => a.customerId === customerProfile?.id);
        return res.status(200).json({
          status: 'success',
          data: filtered
        });
      }

      return res.status(200).json({
        status: 'success',
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = await AppointmentController.getCompanyIdFromUser(req);
      const { id } = req.params;
      const appointment = await AppointmentService.getAppointmentById(id, companyId);
      
      return res.status(200).json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Usuario no autenticado');
      }

      let companyId: string;
      if (req.user.role === Role.CUSTOMER) {
        // El cliente indica la empresa a la que reserva en el body
        companyId = req.body.companyId || req.query.companyId;
        if (!companyId) {
          // Intentar obtenerla del branch
          const branch = await prisma.branch.findUnique({
            where: { id: req.body.branchId }
          });
          if (!branch) {
            throw new BadRequestError('Falta especificar la empresa/sucursal');
          }
          companyId = branch.companyId;
        }
      } else {
        companyId = await AppointmentController.getCompanyIdFromUser(req);
      }

      const appointment = await AppointmentService.createAppointment(
        companyId,
        req.user.id,
        req.user.role,
        req.body
      );

      return res.status(201).json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Usuario no autenticado');
      }

      let companyId: string;
      if (req.user.role === Role.CUSTOMER) {
        // Encontrar empresa asociada al turno que se modifica
        const appt = await prisma.appointment.findUnique({
          where: { id: req.params.id },
          include: { branch: true }
        });
        if (!appt) {
          throw new NotFoundError('Turno no encontrado');
        }
        companyId = appt.branch.companyId;
      } else {
        companyId = await AppointmentController.getCompanyIdFromUser(req);
      }

      const { id } = req.params;
      const appointment = await AppointmentService.updateAppointment(
        id,
        companyId,
        { id: req.user.id, role: req.user.role },
        req.body
      );

      return res.status(200).json({
        status: 'success',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancelar turno aplicando políticas
  static async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('Usuario no autenticado');
      }

      const { id } = req.params;
      const appt = await prisma.appointment.findUnique({
        where: { id },
        include: { branch: true }
      });
      if (!appt) {
        throw new NotFoundError('Turno no encontrado');
      }
      const companyId = appt.branch.companyId;

      const appointment = await AppointmentService.cancelAppointment(
        id,
        companyId,
        { id: req.user.id, role: req.user.role }
      );

      return res.status(200).json({
        status: 'success',
        message: 'Turno cancelado correctamente',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
}

// Importación requerida para la verificación de cliente
import prisma from '../config/prisma';
