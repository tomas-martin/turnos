import prisma from '../config/prisma';
import * as bcrypt from 'bcryptjs';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { Role } from '@prisma/client';

export class EmployeeService {
  static async getEmployees(companyId: string) {
    return prisma.employee.findMany({
      where: {
        branch: { companyId }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    });
  }

  static async getEmployeeById(employeeId: string, companyId: string) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        branch: { companyId }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!employee) {
      throw new NotFoundError('Empleado no encontrado');
    }

    return employee;
  }

  static async createEmployee(companyId: string, data: {
    email: string;
    passwordHash: string;
    name: string;
    lastname: string;
    branchId: string;
    serviceIds?: string[];
  }) {
    // 1. Validar que la sucursal pertenezca a la empresa
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, companyId }
    });

    if (!branch) {
      throw new BadRequestError('La sucursal seleccionada no pertenece a la empresa');
    }

    // 2. Validar que el email no esté tomado
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictError('El correo electrónico ya está registrado');
    }

    // 3. Encriptar contraseña del empleado
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    return prisma.$transaction(async (tx) => {
      // 4. Crear el Usuario
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          lastname: data.lastname,
          role: Role.EMPLOYEE
        }
      });

      // 5. Crear Perfil de Empleado
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          branchId: data.branchId,
          isActive: true
        }
      });

      // 6. Asociar Servicios
      if (data.serviceIds && data.serviceIds.length > 0) {
        const relations = data.serviceIds.map(serviceId => ({
          employeeId: employee.id,
          serviceId
        }));
        await tx.employeeService.createMany({
          data: relations
        });
      }

      return employee;
    });
  }

  static async updateEmployee(employeeId: string, companyId: string, data: {
    name?: string;
    lastname?: string;
    branchId?: string;
    serviceIds?: string[];
    isActive?: boolean;
  }) {
    // Verificar que el empleado existe y pertenece a la empresa
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        branch: { companyId }
      }
    });

    if (!employee) {
      throw new NotFoundError('Empleado no encontrado');
    }

    // Si viene branchId, validar que pertenece a la empresa
    if (data.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: data.branchId, companyId }
      });
      if (!branch) {
        throw new BadRequestError('La sucursal seleccionada no pertenece a la empresa');
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Actualizar datos de Usuario (Nombre, Apellido)
      if (data.name || data.lastname) {
        await tx.user.update({
          where: { id: employee.userId },
          data: {
            name: data.name,
            lastname: data.lastname
          }
        });
      }

      // 2. Actualizar datos de Empleado (Sucursal, Estado Activo)
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          branchId: data.branchId || undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined
        }
      });

      // 3. Actualizar Servicios asignados
      if (data.serviceIds !== undefined) {
        // Borrar anteriores
        await tx.employeeService.deleteMany({
          where: { employeeId }
        });

        // Crear nuevas relaciones
        if (data.serviceIds.length > 0) {
          const relations = data.serviceIds.map(serviceId => ({
            employeeId,
            serviceId
          }));
          await tx.employeeService.createMany({
            data: relations
          });
        }
      }

      return this.getEmployeeById(employeeId, companyId);
    });
  }

  static async deleteEmployee(employeeId: string, companyId: string) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        branch: { companyId }
      }
    });

    if (!employee) {
      throw new NotFoundError('Empleado no encontrado');
    }

    // Verificar si tiene turnos activos
    const appointmentsCount = await prisma.appointment.count({
      where: {
        employeeId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (appointmentsCount > 0) {
      // Borrado lógico para mantener historial e integridad
      return prisma.employee.update({
        where: { id: employeeId },
        data: { isActive: false }
      });
    }

    // Si no tiene turnos activos, borrado físico en cascada
    return prisma.$transaction(async (tx) => {
      await tx.employeeService.deleteMany({
        where: { employeeId }
      });
      await tx.employee.delete({
        where: { id: employeeId }
      });
      return tx.user.delete({
        where: { id: employee.userId }
      });
    });
  }
}
