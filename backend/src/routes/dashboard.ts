import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN)); // Exclusivo para administradores del local

router.get('/', DashboardController.getStats);

export default router;
