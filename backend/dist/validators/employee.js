"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
exports.createEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        lastname: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        branchId: zod_1.z.string({
            required_error: 'La sucursal es requerida'
        }),
        serviceIds: zod_1.z.array(zod_1.z.string()).optional() // IDs de servicios que puede realizar
    })
});
exports.updateEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        lastname: zod_1.z.string().min(2).optional(),
        branchId: zod_1.z.string().optional(),
        serviceIds: zod_1.z.array(zod_1.z.string()).optional(),
        isActive: zod_1.z.boolean().optional()
    })
});
