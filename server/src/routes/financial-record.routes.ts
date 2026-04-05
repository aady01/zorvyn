import { Router } from 'express';
import { listRecords, getRecordById, createRecord, updateRecord, deleteRecord } from '../controllers/financial-record.controller';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validate-request';
import { createRecordSchema, updateRecordSchema, recordIdParamSchema } from '../validations/financial-record.validation';

const router = Router();

router.use(authenticate);

router.get('/', listRecords);
router.get('/:id', validateRequest({ params: recordIdParamSchema }), getRecordById);
router.post('/', validateRequest({ body: createRecordSchema }), createRecord);
router.put('/:id', validateRequest({ params: recordIdParamSchema, body: updateRecordSchema }), updateRecord);
router.delete('/:id', validateRequest({ params: recordIdParamSchema }), deleteRecord);

export default router;
