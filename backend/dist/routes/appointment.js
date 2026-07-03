"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointment_1 = require("../controllers/appointment");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const appointment_2 = require("../validators/appointment");
const router = (0, express_1.Router)();
// Endpoint público para consultar slots libres (ej. para el widget de reservas del cliente)
router.get('/available-slots', appointment_1.AppointmentController.getAvailableSlots);
// Todas las rutas de turnos requieren autenticación
router.use(auth_1.authenticate);
router.get('/', appointment_1.AppointmentController.getAppointments);
router.get('/:id', appointment_1.AppointmentController.getAppointmentById);
router.post('/', (0, validate_1.validate)(appointment_2.createAppointmentSchema), appointment_1.AppointmentController.createAppointment);
router.put('/:id', (0, validate_1.validate)(appointment_2.updateAppointmentSchema), appointment_1.AppointmentController.updateAppointment);
router.post('/:id/cancel', appointment_1.AppointmentController.cancelAppointment);
exports.default = router;
