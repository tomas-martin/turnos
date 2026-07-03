import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    dni: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    observations: z.string().optional().nullable()
  })
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    lastname: z.string().min(2).optional(),
    dni: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    observations: z.string().optional().nullable()
  })
});
