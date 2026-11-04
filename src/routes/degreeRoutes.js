import { Router } from 'express';
import {
  createDegree,
  deleteDegree,
  getDegrees,
  updateDegree,
} from '../controllers/degreeController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { degreeSchema } from '../validators/degreeValidator.js';
import { idParamsSchema } from '../validators/driveValidator.js';

const router = Router();

router.use(requireAuth);
router.get('/', getDegrees);
router.post(
  '/',
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'),
  validateBody(degreeSchema),
  createDegree,
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'),
  validateParams(idParamsSchema),
  validateBody(degreeSchema),
  updateDegree,
);
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'),
  validateParams(idParamsSchema),
  deleteDegree,
);

export default router;
