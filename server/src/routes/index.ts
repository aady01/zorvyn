import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import userRoutes from './user.routes';
import teamRoutes from './team.routes';
import projectRoutes from './project.routes';
import financialRecordRoutes from './financial-record.routes';
import budgetRoutes from './budget.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/records', financialRecordRoutes);
router.use('/budgets', budgetRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
