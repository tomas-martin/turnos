"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceSchema = exports.serviceSchema = void 0;
const zod_1 = require("zod");
exports.serviceSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'El nombre del servicio debe tener al menos 2 caracteres'),
        description: zod_1.z.string().optional().nullable(),
        duration: zod_1.z.number().int().min(5, 'La duración mínima es de 5 minutos'),
        price: zod_1.z.number().positive('El precio debe ser un número positivo'),
        color: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato hexadecimal de color inválido').optional(),
        category: zod_1.z.string().optional().nullable(),
        employeeIds: zod_1.z.array(zod_1.z.string()).optional() // Array de IDs de empleados autorizados
    })
});
exports.updateServiceSchema = zod_1.z.object({
    body: exports.serviceSchema.shape.body.partial()
});
