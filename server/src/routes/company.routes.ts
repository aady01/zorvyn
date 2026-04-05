import { Router } from 'express';
import { getMyCompany, updateMyCompany } from '../controllers/company.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validate-request';
import { updateCompanySchema } from '../validations/company.validation';

const router = Router();

router.use(authenticate);

router.get('/me', getMyCompany);
router.put('/me', authorize('ADMIN'), validateRequest({ body: updateCompanySchema }), updateMyCompany);

export default router;
