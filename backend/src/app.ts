import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error';

import authRoutes from './routes/auth';
import companyRoutes from './routes/company';
import serviceRoutes from './routes/service';
import employeeRoutes from './routes/employee';
import customerRoutes from './routes/customer';
import appointmentRoutes from './routes/appointment';
import notificationRoutes from './routes/notification';
import reportRoutes from './routes/report';
import aiRoutes from './routes/ai';
import dashboardRoutes from './routes/dashboard';

const app = express();

// 1. Middlewares de Seguridad y CORS
app.use(helmet());
app.use(cors({
  origin: '*', // Permitir cualquier origen en desarrollo, limitar en prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 2. Rate Limiting (Prevención de abuso)
const limiter = rateLimit({
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar y configurar Swagger
import { setupSwagger } from './config/swagger';
setupSwagger(app);

// 4. Endpoint de salud
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'El servidor de turnos está funcionando correctamente.',
    timestamp: new Date()
  });
});

// 5. Enrutamiento de Módulos
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 6. Manejador de errores global
app.use(errorHandler);

export default app;
