import { z } from 'zod';

const workingHourDaySchema = z.object({
  day: z.number().min(0).max(6),
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM inválido'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM inválido'),
  active: z.boolean()
});

export const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    logoUrl: z.string().url('URL de logo inválida').nullable().optional(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email('Email de empresa inválido').optional().nullable(),
    timezone: z.string().optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato hexadecimal de color inválido').optional(),
    socialLinks: z.record(z.string()).optional().nullable()
  })
});

export const updateCompanyConfigSchema = z.object({
  body: z.object({
    workingHours: z.array(workingHourDaySchema).optional(),
    minDurationMinutes: z.number().int().min(5).max(480).optional(),
    slotBufferMinutes: z.number().int().min(0).max(120).optional(),
    maxAppointmentsPerSlot: z.number().int().min(1).optional(),
    cancelPolicyDays: z.number().int().min(0).optional(),
    cancelPolicyText: z.string().optional().nullable()
  })
});

export const branchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre de la sucursal debe tener al menos 2 caracteres'),
    address: z.string().min(2, 'La dirección es requerida'),
    phone: z.string().optional().nullable()
  })
});
