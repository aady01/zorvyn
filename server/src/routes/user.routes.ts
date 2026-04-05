import { Router } from 'express';
import { listUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validate-request';
import { createUserSchema, updateUserSchema, userIdParamSchema } from '../validations/user.validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize('MANAGER', 'ADMIN'), listUsers);
router.get('/:id', validateRequest({ params: userIdParamSchema }), getUserById);
router.post('/', authorize('ADMIN'), validateRequest({ body: createUserSchema }), createUser);
router.put('/:id', authorize('ADMIN'), validateRequest({ params: userIdParamSchema, body: updateUserSchema }), updateUser);
router.delete('/:id', authorize('ADMIN'), validateRequest({ params: userIdParamSchema }), deleteUser);

export default router;
