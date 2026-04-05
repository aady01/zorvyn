import { Router } from 'express';
import { listProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/project.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validate-request';
import { createProjectSchema, updateProjectSchema, projectIdParamSchema } from '../validations/project.validation';

const router = Router();

router.use(authenticate);

router.get('/', listProjects);
router.get('/:id', validateRequest({ params: projectIdParamSchema }), getProjectById);
router.post('/', authorize('MANAGER', 'ADMIN'), validateRequest({ body: createProjectSchema }), createProject);
router.put('/:id', authorize('MANAGER', 'ADMIN'), validateRequest({ params: projectIdParamSchema, body: updateProjectSchema }), updateProject);
router.delete('/:id', authorize('ADMIN'), validateRequest({ params: projectIdParamSchema }), deleteProject);

export default router;
