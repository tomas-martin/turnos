"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        lastname: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        dni: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        observations: zod_1.z.string().optional().nullable()
    })
});
exports.updateCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        lastname: zod_1.z.string().min(2).optional(),
        dni: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        observations: zod_1.z.string().optional().nullable()
    })
});
