"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_1 = require("../controllers/employee");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const client_1 = require("@prisma/client");
const employee_2 = require("../validators/employee");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.authenticate);
router.get('/', employee_1.EmployeeController.getEmployees);
router.get('/:employeeId', employee_1.EmployeeController.getEmployeeById);
// Rutas de administración
router.post('/', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(employee_2.createEmployeeSchema), employee_1.EmployeeController.createEmployee);
router.put('/:employeeId', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(employee_2.updateEmployeeSchema), employee_1.EmployeeController.updateEmployee);
router.delete('/:employeeId', (0, auth_1.authorize)(client_1.Role.ADMIN), employee_1.EmployeeController.deleteEmployee);
exports.default = router;
