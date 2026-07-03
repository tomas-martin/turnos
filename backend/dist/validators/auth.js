"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.registerBusinessSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
    })
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        lastname: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        dni: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional()
    })
});
exports.registerBusinessSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        name: zod_1.z.string().min(2, 'El nombre del administrador debe tener al menos 2 caracteres'),
        lastname: zod_1.z.string().min(2, 'El apellido del administrador debe tener al menos 2 caracteres'),
        companyName: zod_1.z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional()
    })
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string({
            required_error: 'El refresh token es requerido'
        })
    })
});
