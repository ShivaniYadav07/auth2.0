import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authLimiter, authController.refresh);

export default router;
