"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const client_1 = require("@prisma/client");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-access-secret-12345-extremely-long-string-for-security';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-12345-extremely-long-string-for-security';
const ACCESS_EXPIRY = (process.env.JWT_EXPIRES_IN || '15m');
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRES_IN || '7d');
class AuthService {
    static generateTokens(payload) {
        const accessToken = jwt.sign({ id: payload.id, email: payload.email, role: payload.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
        const refreshToken = jwt.sign({ id: payload.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
        return { accessToken, refreshToken };
    }
    static async registerCustomer(data) {
        // Verificar si el email ya existe
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new errors_1.ConflictError('El correo electrónico ya está registrado');
        }
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.passwordHash, salt);
        // Crear usuario y perfil de cliente en una transacción
        const result = await prisma_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    lastname: data.lastname,
                    role: client_1.Role.CUSTOMER
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
        await prisma_1.default.user.update({
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
    static async registerBusiness(data) {
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new errors_1.ConflictError('El correo electrónico ya está registrado');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.passwordHash, salt);
        const result = await prisma_1.default.$transaction(async (tx) => {
            // 1. Crear usuario Admin
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    name: data.name,
                    lastname: data.lastname,
                    role: client_1.Role.ADMIN
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
        await prisma_1.default.user.update({
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
    static async login(credentials) {
        const user = await prisma_1.default.user.findUnique({
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
            throw new errors_1.UnauthorizedError('Credenciales incorrectas');
        }
        const isPasswordValid = await bcrypt.compare(credentials.passwordHash, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Credenciales incorrectas');
        }
        const tokens = this.generateTokens(user);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });
        // Intentar buscar empresa asociada si es Admin
        let company = null;
        let branch = null;
        let employeeProfile = null;
        if (user.role === client_1.Role.ADMIN) {
            // Para admin buscamos la empresa asociada a su email de registro
            company = await prisma_1.default.company.findFirst({
                where: { email: user.email }
            });
            if (company) {
                branch = await prisma_1.default.branch.findFirst({
                    where: { companyId: company.id }
                });
            }
        }
        else if (user.role === client_1.Role.EMPLOYEE && user.employee) {
            employeeProfile = {
                id: user.employee.id,
                branchId: user.employee.branchId,
                isActive: user.employee.isActive
            };
            branch = user.employee.branch;
            company = user.employee.branch.company;
        }
        else if (user.role === client_1.Role.CUSTOMER) {
            const customer = await prisma_1.default.customer.findUnique({
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
    static async refresh(token) {
        try {
            const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
            const user = await prisma_1.default.user.findUnique({
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
                throw new errors_1.UnauthorizedError('Token de actualización no válido');
            }
            const tokens = this.generateTokens(user);
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { refreshToken: tokens.refreshToken }
            });
            let company = null;
            let branch = null;
            if (user.role === client_1.Role.ADMIN) {
                company = await prisma_1.default.company.findFirst({
                    where: { email: user.email }
                });
                if (company) {
                    branch = await prisma_1.default.branch.findFirst({
                        where: { companyId: company.id }
                    });
                }
            }
            else if (user.role === client_1.Role.EMPLOYEE && user.employee) {
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
        }
        catch (error) {
            throw new errors_1.UnauthorizedError('Token de actualización expirado o no válido');
        }
    }
    static async logout(userId) {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { refreshToken: null }
        });
        return { success: true };
    }
}
exports.AuthService = AuthService;
