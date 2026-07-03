import { z } from 'zod';

export const serviceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre del servicio debe tener al menos 2 caracteres'),
    description: z.string().optional().nullable(),
    duration: z.number().int().min(5, 'La duración mínima es de 5 minutos'),
    price: z.number().positive('El precio debe ser un número positivo'),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato hexadecimal de color inválido').optional(),
    category: z.string().optional().nullable(),
    employeeIds: z.array(z.string()).optional() // Array de IDs de empleados autorizados
  })
});

export const updateServiceSchema = z.object({
  body: serviceSchema.shape.body.partial()
});
