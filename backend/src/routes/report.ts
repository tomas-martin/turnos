import { Router } from 'express';
import { ReportController } from '../controllers/report';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.EMPLOYEE)); // Solo administración exporta reportes

router.get('/csv', ReportController.downloadCSV);
router.get('/excel', ReportController.downloadExcel);
router.get('/pdf', ReportController.downloadPDF);

export default router;
