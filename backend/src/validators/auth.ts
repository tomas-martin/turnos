import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
  })
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastname: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    dni: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional()
  })
});

export const registerBusinessSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre del administrador debe tener al menos 2 caracteres'),
    lastname: z.string().min(2, 'El apellido del administrador debe tener al menos 2 caracteres'),
    companyName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
    phone: z.string().optional(),
    address: z.string().optional()
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'El refresh token es requerido'
    })
  })
});
