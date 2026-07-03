import { Router } from 'express';
import { CustomerController } from '../controllers/customer';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { Role } from '@prisma/client';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Perfil propio del cliente logueado
router.get('/me', CustomerController.getMyCustomerProfile);

// Listado general (solo para administración)
router.get('/', authorize(Role.ADMIN, Role.EMPLOYEE), CustomerController.getCustomers);
router.get('/:customerId', CustomerController.getCustomerById);

// Registrar cliente de forma manual
router.post('/', authorize(Role.ADMIN, Role.EMPLOYEE), validate(createCustomerSchema), CustomerController.createCustomer);

// Actualizar datos
router.put('/:customerId', validate(updateCustomerSchema), CustomerController.updateCustomer);

// Eliminar (solo Admin)
router.delete('/:customerId', authorize(Role.ADMIN), CustomerController.deleteCustomer);

export default router;
