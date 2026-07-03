"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentSchema = exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createAppointmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.string({
            required_error: 'La sucursal es requerida'
        }),
        customerId: zod_1.z.string().optional(), // Si no viene, se toma del token (para el cliente)
        employeeId: zod_1.z.string({
            required_error: 'El empleado es requerido'
        }),
        serviceId: zod_1.z.string({
            required_error: 'El servicio es requerido'
        }),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido, debe ser AAAA-MM-DD'),
        startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, debe ser HH:MM'),
        notes: zod_1.z.string().optional().nullable(),
        paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'TRANSFER']).optional()
    })
});
exports.updateAppointmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeId: zod_1.z.string().optional(),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido, debe ser AAAA-MM-DD').optional(),
        startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, debe ser HH:MM').optional(),
        status: zod_1.z.nativeEnum(client_1.AppointmentStatus).optional(),
        notes: zod_1.z.string().optional().nullable()
    })
});
