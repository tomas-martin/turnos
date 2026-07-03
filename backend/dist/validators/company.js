"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchSchema = exports.updateCompanyConfigSchema = exports.updateCompanySchema = void 0;
const zod_1 = require("zod");
const workingHourDaySchema = zod_1.z.object({
    day: zod_1.z.number().min(0).max(6),
    start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM inválido'),
    end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM inválido'),
    active: zod_1.z.boolean()
});
exports.updateCompanySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
        logoUrl: zod_1.z.string().url('URL de logo inválida').nullable().optional(),
        address: zod_1.z.string().optional().nullable(),
        phone: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email('Email de empresa inválido').optional().nullable(),
        timezone: zod_1.z.string().optional(),
        primaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato hexadecimal de color inválido').optional(),
        socialLinks: zod_1.z.record(zod_1.z.string()).optional().nullable()
    })
});
exports.updateCompanyConfigSchema = zod_1.z.object({
    body: zod_1.z.object({
        workingHours: zod_1.z.array(workingHourDaySchema).optional(),
        minDurationMinutes: zod_1.z.number().int().min(5).max(480).optional(),
        slotBufferMinutes: zod_1.z.number().int().min(0).max(120).optional(),
        maxAppointmentsPerSlot: zod_1.z.number().int().min(1).optional(),
        cancelPolicyDays: zod_1.z.number().int().min(0).optional(),
        cancelPolicyText: zod_1.z.string().optional().nullable()
    })
});
exports.branchSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'El nombre de la sucursal debe tener al menos 2 caracteres'),
        address: zod_1.z.string().min(2, 'La dirección es requerida'),
        phone: zod_1.z.string().optional().nullable()
    })
});
