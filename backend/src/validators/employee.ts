import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    branchId: z.string({
      required_error: 'La sucursal es requerida'
    }),
    serviceIds: z.array(z.string()).optional() // IDs de servicios que puede realizar
  })
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    lastname: z.string().min(2).optional(),
    branchId: z.string().optional(),
    serviceIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
});
