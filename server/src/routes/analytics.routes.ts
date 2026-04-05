import { Router } from 'express';
import { getSummary, getByTeam, getByCategory, getBudgetVsActual, getTrends } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validate-request';
import { analyticsQuerySchema } from '../validations/analytics.validation';

const router = Router();

router.use(authenticate);

router.get('/summary', validateRequest({ query: analyticsQuerySchema }), getSummary);
router.get('/by-team', authorize('MANAGER', 'ADMIN'), validateRequest({ query: analyticsQuerySchema }), getByTeam);
router.get('/by-category', validateRequest({ query: analyticsQuerySchema }), getByCategory);
router.get('/budget-vs-actual', authorize('MANAGER', 'ADMIN'), validateRequest({ query: analyticsQuerySchema }), getBudgetVsActual);
router.get('/trends', validateRequest({ query: analyticsQuerySchema }), getTrends);

export default router;
