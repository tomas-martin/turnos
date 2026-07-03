import { Router } from 'express';
import { CompanyController } from '../controllers/company';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { Role } from '@prisma/client';
import {
  updateCompanySchema,
  updateCompanyConfigSchema,
  branchSchema
} from '../validators/company';

const router = Router();

// Endpoint público para que los clientes obtengan datos de la barbería/empresa antes de reservar
router.get('/public', CompanyController.getAllPublicCompanies);
router.get('/public/:companyId', CompanyController.getPublicCompany);

// Rutas protegidas
router.use(authenticate);

router.get('/', CompanyController.getMyCompany);
router.put('/', authorize(Role.ADMIN), validate(updateCompanySchema), CompanyController.updateMyCompany);
router.put('/config', authorize(Role.ADMIN), validate(updateCompanyConfigSchema), CompanyController.updateMyCompanyConfig);

// Rutas de sucursales (Branches)
router.get('/branches', CompanyController.getMyBranches);
router.post('/branches', authorize(Role.ADMIN), validate(branchSchema), CompanyController.createMyBranch);
router.put('/branches/:branchId', authorize(Role.ADMIN), validate(branchSchema), CompanyController.updateMyBranch);
router.delete('/branches/:branchId', authorize(Role.ADMIN), CompanyController.deleteMyBranch);

export default router;
