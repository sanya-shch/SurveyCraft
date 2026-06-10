import { Router } from 'express';
import { getMeHandler, login, register } from './auth.controller.js';
import { authMiddleware } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), asyncHandler(login));
router.get('/me', authMiddleware, getMeHandler);

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

export default router;
