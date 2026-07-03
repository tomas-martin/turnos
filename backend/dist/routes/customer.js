"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_1 = require("../controllers/customer");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const client_1 = require("@prisma/client");
const customer_2 = require("../validators/customer");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
// Perfil propio del cliente logueado
router.get('/me', customer_1.CustomerController.getMyCustomerProfile);
// Listado general (solo para administración)
router.get('/', (0, auth_1.authorize)(client_1.Role.ADMIN, client_1.Role.EMPLOYEE), customer_1.CustomerController.getCustomers);
router.get('/:customerId', customer_1.CustomerController.getCustomerById);
// Registrar cliente de forma manual
router.post('/', (0, auth_1.authorize)(client_1.Role.ADMIN, client_1.Role.EMPLOYEE), (0, validate_1.validate)(customer_2.createCustomerSchema), customer_1.CustomerController.createCustomer);
// Actualizar datos
router.put('/:customerId', (0, validate_1.validate)(customer_2.updateCustomerSchema), customer_1.CustomerController.updateCustomer);
// Eliminar (solo Admin)
router.delete('/:customerId', (0, auth_1.authorize)(client_1.Role.ADMIN), customer_1.CustomerController.deleteCustomer);
exports.default = router;
