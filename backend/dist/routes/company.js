"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_1 = require("../controllers/company");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const client_1 = require("@prisma/client");
const company_2 = require("../validators/company");
const router = (0, express_1.Router)();
// Endpoint público para que los clientes obtengan datos de la barbería/empresa antes de reservar
router.get('/public', company_1.CompanyController.getAllPublicCompanies);
router.get('/public/:companyId', company_1.CompanyController.getPublicCompany);
// Rutas protegidas
router.use(auth_1.authenticate);
router.get('/', company_1.CompanyController.getMyCompany);
router.put('/', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(company_2.updateCompanySchema), company_1.CompanyController.updateMyCompany);
router.put('/config', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(company_2.updateCompanyConfigSchema), company_1.CompanyController.updateMyCompanyConfig);
// Rutas de sucursales (Branches)
router.get('/branches', company_1.CompanyController.getMyBranches);
router.post('/branches', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(company_2.branchSchema), company_1.CompanyController.createMyBranch);
router.put('/branches/:branchId', (0, auth_1.authorize)(client_1.Role.ADMIN), (0, validate_1.validate)(company_2.branchSchema), company_1.CompanyController.updateMyBranch);
router.delete('/branches/:branchId', (0, auth_1.authorize)(client_1.Role.ADMIN), company_1.CompanyController.deleteMyBranch);
exports.default = router;
