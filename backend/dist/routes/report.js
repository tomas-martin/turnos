"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_1 = require("../controllers/report");
const auth_1 = require("../middlewares/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(client_1.Role.ADMIN, client_1.Role.EMPLOYEE)); // Solo administración exporta reportes
router.get('/csv', report_1.ReportController.downloadCSV);
router.get('/excel', report_1.ReportController.downloadExcel);
router.get('/pdf', report_1.ReportController.downloadPDF);
exports.default = router;
