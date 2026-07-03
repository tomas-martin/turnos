"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_1 = require("../controllers/dashboard");
const auth_1 = require("../middlewares/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(client_1.Role.ADMIN)); // Exclusivo para administradores del local
router.get('/', dashboard_1.DashboardController.getStats);
exports.default = router;
