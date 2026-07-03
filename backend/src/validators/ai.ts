import { z } from 'zod';

export const aiQuerySchema = z.object({
  body: z.object({
    question: z.string().min(2, 'La consulta debe tener al menos 2 caracteres')
  })
});
