import { Router } from 'express';
import { createApplication, getApplications } from '../controllers/applicationController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  applicationListQuerySchema,
  createApplicationSchema,
} from '../validators/applicationValidator.js';

const router = Router();

router.use(requireAuth, authorizeRoles('ADMIN', 'PLACEMENT_OFFICER', 'STUDENT'));

router.get('/', validateQuery(applicationListQuerySchema), getApplications);
router.post('/', validateBody(createApplicationSchema), createApplication);

export default router;
