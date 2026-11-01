import { Router } from 'express';
import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
} from '../controllers/studentController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), getStudents);
router.post('/', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), createStudent);
router.put('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), updateStudent);
router.delete('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), deleteStudent);

export default router;
