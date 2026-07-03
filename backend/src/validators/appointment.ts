import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

export const createAppointmentSchema = z.object({
  body: z.object({
    branchId: z.string({
      required_error: 'La sucursal es requerida'
    }),
    customerId: z.string().optional(), // Si no viene, se toma del token (para el cliente)
    employeeId: z.string({
      required_error: 'El empleado es requerido'
    }),
    serviceId: z.string({
      required_error: 'El servicio es requerido'
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido, debe ser AAAA-MM-DD'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, debe ser HH:MM'),
    notes: z.string().optional().nullable(),
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER']).optional()
  })
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    employeeId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido, debe ser AAAA-MM-DD').optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, debe ser HH:MM').optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    notes: z.string().optional().nullable()
  })
});
