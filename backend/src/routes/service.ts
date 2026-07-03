import { Router } from 'express';
import { ServiceController } from '../controllers/service';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { Role } from '@prisma/client';
import { serviceSchema, updateServiceSchema } from '../validators/service';

const router = Router();

// Todas las rutas de servicios requieren autenticación
router.use(authenticate);

router.get('/', ServiceController.getServices);
router.get('/:serviceId', ServiceController.getServiceById);
router.post('/', authorize(Role.ADMIN), validate(serviceSchema), ServiceController.createService);
router.put('/:serviceId', authorize(Role.ADMIN), validate(updateServiceSchema), ServiceController.updateService);
router.delete('/:serviceId', authorize(Role.ADMIN), ServiceController.deleteService);

export default router;
