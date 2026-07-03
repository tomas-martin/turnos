import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createAppointmentSchema, updateAppointmentSchema } from '../validators/appointment';

const router = Router();

// Endpoint público para consultar slots libres (ej. para el widget de reservas del cliente)
router.get('/available-slots', AppointmentController.getAvailableSlots);

// Todas las rutas de turnos requieren autenticación
router.use(authenticate);

router.get('/', AppointmentController.getAppointments);
router.get('/:id', AppointmentController.getAppointmentById);
router.post('/', validate(createAppointmentSchema), AppointmentController.createAppointment);
router.put('/:id', validate(updateAppointmentSchema), AppointmentController.updateAppointment);
router.post('/:id/cancel', AppointmentController.cancelAppointment);

export default router;
