import { Router } from 'express';
import { listTeams, getTeamById, createTeam, updateTeam, deleteTeam } from '../controllers/team.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validate-request';
import { createTeamSchema, updateTeamSchema, teamIdParamSchema } from '../validations/team.validation';

const router = Router();

router.use(authenticate);

router.get('/', listTeams);
router.get('/:id', validateRequest({ params: teamIdParamSchema }), getTeamById);
router.post('/', authorize('ADMIN'), validateRequest({ body: createTeamSchema }), createTeam);
router.put('/:id', authorize('ADMIN'), validateRequest({ params: teamIdParamSchema, body: updateTeamSchema }), updateTeam);
router.delete('/:id', authorize('ADMIN'), validateRequest({ params: teamIdParamSchema }), deleteTeam);

export default router;
