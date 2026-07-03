"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_1 = require("../controllers/service");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const client_1 = require("@prisma/client");
const service_2 = require("../validators/service");
const router = (0, express_1.Router)();
// Todas las rutas de servicios requieren autenticación
router.use(auth_1.authenticate);
router.get('/', service_1.ServiceController.getServices);
router.get('/:serviceId', service_1.ServiceController.getServiceById);
router.post('/', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(service_2.serviceSchema), service_1.ServiceController.createService);
router.put('/:serviceId', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(service_2.updateServiceSchema), service_1.ServiceController.updateService);
router.delete('/:serviceId', (0, auth_1.authorize)(client_1.Role.ADMIN), service_1.ServiceController.deleteService);
exports.default = router;
