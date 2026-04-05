import { Router } from 'express';
import { register, login, refresh } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate-request';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/refresh', validateRequest({ body: refreshSchema }), refresh);

export default router;
