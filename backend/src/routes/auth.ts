import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  loginSchema,
  registerSchema,
  registerBusinessSchema,
  refreshTokenSchema
} from '../validators/auth';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.registerCustomer);
router.post('/register-business', validate(registerBusinessSchema), AuthController.registerBusiness);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);

export default router;
