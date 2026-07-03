import prisma from '../config/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class CompanyService {
  static async getCompanyForUser(user: { id: string; email: string; role: string }) {
    let company = null;

    if (user.role === 'ADMIN') {
      company = await prisma.company.findFirst({
        where: { email: user.email },
        include: { config: true, branches: true }
      });
    } else if (user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: {
          branch: {
            include: {
              company: {
                include: { config: true, branches: true }
              }
            }
          }
        }
      });
      company = employee?.branch?.company || null;
    }

    if (!company) {
      throw new NotFoundError('Empresa no encontrada para el usuario actual');
    }

    return company;
  }

  static async getAllCompanies() {
    return prisma.company.findMany();
  }

  // Permite obtener datos públicos de la empresa (para clientes que van a reservar)
  static async getPublicCompanyDetails(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        config: true,
        branches: true,
        services: {
          where: { isActive: true }
        }
      }
    });

    if (!company) {
      throw new NotFoundError('Empresa no encontrada');
    }

    return company;
  }

  static async updateCompany(companyId: string, data: any) {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundError('Empresa no encontrada');
    }

    return prisma.company.update({
      where: { id: companyId },
      data
    });
  }

  static async updateCompanyConfig(companyId: string, data: any) {
    const config = await prisma.companyConfig.findUnique({
      where: { companyId }
    });

    if (!config) {
      throw new NotFoundError('Configuración de empresa no encontrada');
    }

    return prisma.companyConfig.update({
      where: { companyId },
      data
    });
  }

  static async getBranches(companyId: string) {
    return prisma.branch.findMany({
      where: { companyId }
    });
  }

  static async createBranch(companyId: string, data: { name: string; address: string; phone?: string | null }) {
    return prisma.branch.create({
      data: {
        companyId,
        name: data.name,
        address: data.address,
        phone: data.phone
      }
    });
  }

  static async updateBranch(branchId: string, companyId: string, data: any) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId }
    });

    if (!branch) {
      throw new NotFoundError('Sucursal no encontrada en esta empresa');
    }

    return prisma.branch.update({
      where: { id: branchId },
      data
    });
  }

  static async deleteBranch(branchId: string, companyId: string) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId }
    });

    if (!branch) {
      throw new NotFoundError('Sucursal no encontrada en esta empresa');
    }

    // Verificar si hay empleados o turnos asignados a la sucursal antes de borrar
    const activeEmployees = await prisma.employee.count({
      where: { branchId }
    });

    const activeAppointments = await prisma.appointment.count({
      where: { branchId, status: { in: ['PENDING', 'CONFIRMED'] } }
    });

    if (activeEmployees > 0 || activeAppointments > 0) {
      throw new BadRequestError('No se puede eliminar la sucursal porque tiene empleados o turnos activos asignados.');
    }

    return prisma.branch.delete({
      where: { id: branchId }
    });
  }
}
