import { Router } from 'express';
import { listBudgets, createBudget, updateBudget } from '../controllers/budget.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validate-request';
import { createBudgetSchema, updateBudgetSchema, budgetIdParamSchema } from '../validations/budget.validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize('MANAGER', 'ADMIN'), listBudgets);
router.post('/', authorize('MANAGER', 'ADMIN'), validateRequest({ body: createBudgetSchema }), createBudget);
router.put('/:id', authorize('MANAGER', 'ADMIN'), validateRequest({ params: budgetIdParamSchema, body: updateBudgetSchema }), updateBudget);

export default router;
