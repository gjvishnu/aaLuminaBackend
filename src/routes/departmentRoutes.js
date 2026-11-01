import { Router } from 'express';
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../controllers/departmentController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getDepartments);
router.post('/', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), createDepartment);
router.put('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), updateDepartment);
router.delete('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), deleteDepartment);

export default router;
