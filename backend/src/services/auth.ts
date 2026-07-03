import prisma from '../config/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError, ConflictError } from '../utils/errors';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-access-secret-12345-extremely-long-string-for-security';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-12345-extremely-long-string-for-security';
const ACCESS_EXPIRY = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export class AuthService {
  private static generateTokens(payload: { id: string; email: string; role: Role }) {
    const accessToken = jwt.sign(
      { id: payload.id, email: payload.email, role: payload.role },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: payload.id },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  static async registerCustomer(data: {
    email: string;
    passwordHash: string;
    name: string;
    lastname: string;
    dni?: string;
    phone?: string;
    address?: string;
  }) {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictError('El correo electrónico ya está registrado');
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    // Crear usuario y perfil de cliente en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          lastname: data.lastname,
          role: Role.CUSTOMER
        }
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          dni: data.dni,
          phone: data.phone,
          address: data.address
        }
      });

      return { user, customer };
    });

    const tokens = this.generateTokens(result.user);
    
    // Guardar refresh token
    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        lastname: result.user.lastname,
        role: result.user.role
      },
      ...tokens
    };
  }

  static async registerBusiness(data: {
    email: string;
    passwordHash: string;
    name: string;
    lastname: string;
    companyName: string;
    phone?: string;
    address?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictError('El correo electrónico ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear usuario Admin
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          lastname: data.lastname,
          role: Role.ADMIN
        }
      });

      // 2. Crear Empresa
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          address: data.address,
          phone: data.phone,
          email: data.email
        }
      });

      // 3. Crear Configuración básica
      const defaultWorkingHours = [
        { day: 1, start: '09:00', end: '18:00', active: true },
        { day: 2, start: '09:00', end: '18:00', active: true },
        { day: 3, start: '09:00', end: '18:00', active: true },
        { day: 4, start: '09:00', end: '18:00', active: true },
        { day: 5, start: '09:00', end: '18:00', active: true },
        { day: 6, start: '09:00', end: '13:00', active: true },
        { day: 0, start: '09:00', end: '13:00', active: false }
      ];

      await tx.companyConfig.create({
        data: {
          companyId: company.id,
          workingHours: defaultWorkingHours,
          minDurationMinutes: 30,
          slotBufferMinutes: 0,
          maxAppointmentsPerSlot: 1,
          cancelPolicyDays: 1,
          cancelPolicyText: 'Las cancelaciones deben realizarse al menos 24 horas antes.'
        }
      });

      // 4. Crear Sucursal por defecto
      const branch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: 'Casa Central',
          address: data.address || 'Dirección principal',
          phone: data.phone || ''
        }
      });

      return { user, company, branch };
    });

    const tokens = this.generateTokens(result.user);

    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        lastname: result.user.lastname,
        role: result.user.role
      },
      company: result.company,
      ...tokens
    };
  }

  static async login(credentials: { email: string; passwordHash: string }) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        employee: {
          include: {
            branch: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(credentials.passwordHash, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const tokens = this.generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    // Intentar buscar empresa asociada si es Admin
    let company = null;
    let branch = null;
    let employeeProfile = null;

    if (user.role === Role.ADMIN) {
      // Para admin buscamos la empresa asociada a su email de registro
      company = await prisma.company.findFirst({
        where: { email: user.email }
      });
      if (company) {
        branch = await prisma.branch.findFirst({
          where: { companyId: company.id }
        });
      }
    } else if (user.role === Role.EMPLOYEE && user.employee) {
      employeeProfile = {
        id: user.employee.id,
        branchId: user.employee.branchId,
        isActive: user.employee.isActive
      };
      branch = user.employee.branch;
      company = user.employee.branch.company;
    } else if (user.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.id }
      });
      employeeProfile = customer; // return customer profile
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        role: user.role
      },
      company,
      branch,
      profile: employeeProfile,
      ...tokens
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          employee: {
            include: {
              branch: {
                include: {
                  company: true
                }
              }
            }
          }
        }
      });

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedError('Token de actualización no válido');
      }

      const tokens = this.generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      let company = null;
      let branch = null;

      if (user.role === Role.ADMIN) {
        company = await prisma.company.findFirst({
          where: { email: user.email }
        });
        if (company) {
          branch = await prisma.branch.findFirst({
            where: { companyId: company.id }
          });
        }
      } else if (user.role === Role.EMPLOYEE && user.employee) {
        branch = user.employee.branch;
        company = user.employee.branch.company;
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastname: user.lastname,
          role: user.role
        },
        company,
        branch,
        ...tokens
      };
    } catch (error) {
      throw new UnauthorizedError('Token de actualización expirado o no válido');
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
    return { success: true };
  }
}
