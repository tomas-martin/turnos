import { Router } from 'express';
import { AIController } from '../controllers/ai';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { Role } from '@prisma/client';
import { aiQuerySchema } from '../validators/ai';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN)); // Solo el administrador tiene acceso a las consultas de IA del negocio

router.post('/query', validate(aiQuerySchema), AIController.queryBusiness);

export default router;
