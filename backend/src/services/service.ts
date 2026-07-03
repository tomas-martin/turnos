import prisma from '../config/prisma';
import { NotFoundError } from '../utils/errors';

export class ServiceService {
  static async getServices(companyId: string, includeInactive = false) {
    return prisma.service.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    lastname: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  static async getServiceById(serviceId: string, companyId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId },
      include: {
        employees: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    lastname: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!service) {
      throw new NotFoundError('Servicio no encontrado');
    }

    return service;
  }

  static async createService(companyId: string, data: {
    name: string;
    description?: string | null;
    duration: number;
    price: number;
    color?: string;
    category?: string | null;
    employeeIds?: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Crear el servicio
      const service = await tx.service.create({
        data: {
          companyId,
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          color: data.color,
          category: data.category
        }
      });

      // 2. Asociar los empleados si vienen especificados
      if (data.employeeIds && data.employeeIds.length > 0) {
        const relations = data.employeeIds.map(empId => ({
          employeeId: empId,
          serviceId: service.id
        }));
        await tx.employeeService.createMany({
          data: relations
        });
      }

      return this.getServiceById(service.id, companyId);
    });
  }

  static async updateService(serviceId: string, companyId: string, data: {
    name?: string;
    description?: string | null;
    duration?: number;
    price?: number;
    color?: string;
    category?: string | null;
    isActive?: boolean;
    employeeIds?: string[];
  }) {
    // Verificar existencia
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, companyId }
    });

    if (!existing) {
      throw new NotFoundError('Servicio no encontrado');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Actualizar campos del servicio
      const { employeeIds, ...serviceData } = data;
      await tx.service.update({
        where: { id: serviceId },
        data: serviceData
      });

      // 2. Si se provee lista de empleados, actualizar relaciones
      if (employeeIds !== undefined) {
        // Borrar anteriores
        await tx.employeeService.deleteMany({
          where: { serviceId }
        });

        // Crear nuevas
        if (employeeIds.length > 0) {
          const relations = employeeIds.map(empId => ({
            employeeId: empId,
            serviceId
          }));
          await tx.employeeService.createMany({
            data: relations
          });
        }
      }

      return this.getServiceById(serviceId, companyId);
    });
  }

  static async deleteService(serviceId: string, companyId: string) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId }
    });

    if (!service) {
      throw new NotFoundError('Servicio no encontrado');
    }

    // Verificar si el servicio tiene turnos asociados
    const appointmentsCount = await prisma.appointment.count({
      where: { serviceId }
    });

    if (appointmentsCount > 0) {
      // Si tiene turnos, realizamos un borrado lógico para no romper integridad referencial
      return prisma.service.update({
        where: { id: serviceId },
        data: { isActive: false }
      });
    }

    // Si no tiene turnos, borrado físico de relaciones y del servicio
    return prisma.$transaction(async (tx) => {
      await tx.employeeService.deleteMany({
        where: { serviceId }
      });
      return tx.service.delete({
        where: { id: serviceId }
      });
    });
  }
}
