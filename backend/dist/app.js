"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_1 = require("./middlewares/error");
const auth_1 = __importDefault(require("./routes/auth"));
const company_1 = __importDefault(require("./routes/company"));
const service_1 = __importDefault(require("./routes/service"));
const employee_1 = __importDefault(require("./routes/employee"));
const customer_1 = __importDefault(require("./routes/customer"));
const appointment_1 = __importDefault(require("./routes/appointment"));
const notification_1 = __importDefault(require("./routes/notification"));
const report_1 = __importDefault(require("./routes/report"));
const ai_1 = __importDefault(require("./routes/ai"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const app = (0, express_1.default)();
// 1. Middlewares de Seguridad y CORS
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*', // Permitir cualquier origen en desarrollo, limitar en prod
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// 2. Rate Limiting (Prevención de abuso)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Límite de 200 peticiones por ventana para desarrollo
    message: {
        status: 'error',
        message: 'Demasiadas peticiones desde esta IP. Intente de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);
// 3. Parsers de peticiones
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Importar y configurar Swagger
const swagger_1 = require("./config/swagger");
(0, swagger_1.setupSwagger)(app);
// 4. Endpoint de salud
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'El servidor de turnos está funcionando correctamente.',
        timestamp: new Date()
    });
});
// 5. Enrutamiento de Módulos
app.use('/api/auth', auth_1.default);
app.use('/api/company', company_1.default);
app.use('/api/services', service_1.default);
app.use('/api/employees', employee_1.default);
app.use('/api/customers', customer_1.default);
app.use('/api/appointments', appointment_1.default);
app.use('/api/notifications', notification_1.default);
app.use('/api/reports', report_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/dashboard', dashboard_1.default);
// 6. Manejador de errores global
app.use(error_1.errorHandler);
exports.default = app;
