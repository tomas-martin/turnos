"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../controllers/ai");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const client_1 = require("@prisma/client");
const ai_2 = require("../validators/ai");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(client_1.Role.ADMIN)); // Solo el administrador tiene acceso a las consultas de IA del negocio
router.post('/query', (0, validate_1.validate)(ai_2.aiQuerySchema), ai_1.AIController.queryBusiness);
exports.default = router;
