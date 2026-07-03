import { Router } from 'express';
import { EmployeeController } from '../controllers/employee';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { Role } from '@prisma/client';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/', EmployeeController.getEmployees);
router.get('/:employeeId', EmployeeController.getEmployeeById);

// Rutas de administración
router.post('/', authorize(Role.ADMIN), validate(createEmployeeSchema), EmployeeController.createEmployee);
router.put('/:employeeId', authorize(Role.ADMIN), validate(updateEmployeeSchema), EmployeeController.updateEmployee);
router.delete('/:employeeId', authorize(Role.ADMIN), EmployeeController.deleteEmployee);

export default router;
