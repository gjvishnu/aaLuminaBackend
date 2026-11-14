import { Router } from 'express';
import { getJob, getJobs } from '../controllers/jobController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import {
  jobDetailQuerySchema,
  jobListQuerySchema,
  jobParamsSchema,
} from '../validators/jobValidator.js';

const router = Router();

router.use(requireAuth, authorizeRoles('ADMIN', 'PLACEMENT_OFFICER', 'STUDENT'));

router.get('/', validateQuery(jobListQuerySchema), getJobs);
router.get(
  '/:roleId',
  validateParams(jobParamsSchema),
  validateQuery(jobDetailQuerySchema),
  getJob,
);

export default router;
