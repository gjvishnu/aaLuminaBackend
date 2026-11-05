import { Router } from 'express';
import {
  createStudent,
  deleteStudent,
  getStudentProfile,
  getStudents,
  updateStudent,
} from '../controllers/studentController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';
import { requireOwnStudentRecord, requireOwnStudentUser } from '../middleware/studentAccess.js';
import { validateQuery } from '../middleware/validate.js';
import { studentProfileQuerySchema } from '../validators/studentProfileValidator.js';
import studentProfileRoutes from './studentProfileRoutes.js';

const router = Router();

router.use(requireAuth);
router.get('/', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), getStudents);
router.get(
  '/profile',
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER', 'STUDENT'),
  validateQuery(studentProfileQuerySchema),
  getStudentProfile,
);
router.post(
  '/',
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER', 'STUDENT'),
  requireOwnStudentUser,
  createStudent,
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER', 'STUDENT'),
  requireOwnStudentRecord,
  updateStudent,
);
router.delete('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), deleteStudent);
router.use('/:studentId', studentProfileRoutes);

export default router;
