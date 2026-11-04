import { Router } from 'express';
import {
  createInternship,
  deleteInternship,
  getInternship,
  getInternships,
  updateInternship,
} from '../controllers/internshipController.js';
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from '../controllers/projectController.js';
import {
  addStudentSkill,
  getStudentSkills,
  removeStudentSkill,
  replaceStudentSkills,
} from '../controllers/studentSkillController.js';
import { authorizeRoles } from '../middleware/auth.js';
import { requireStudentAccess } from '../middleware/studentAccess.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  addStudentSkillSchema,
  internshipSchema,
  projectSchema,
  replaceStudentSkillsSchema,
  studentItemParamsSchema,
  studentParamsSchema,
  studentSkillParamsSchema,
} from '../validators/studentProfileValidator.js';

// Mounted at /api/students/:studentId behind requireAuth.
const router = Router({ mergeParams: true });
const itemParams = validateParams(studentItemParamsSchema);

router.use(
  authorizeRoles('ADMIN', 'PLACEMENT_OFFICER', 'STUDENT'),
  validateParams(studentParamsSchema),
  requireStudentAccess,
);

router.get('/skills', getStudentSkills);
router.post('/skills', validateBody(addStudentSkillSchema), addStudentSkill);
router.put('/skills', validateBody(replaceStudentSkillsSchema), replaceStudentSkills);
router.delete(
  '/skills/:skillId',
  validateParams(studentSkillParamsSchema),
  removeStudentSkill,
);

router.get('/internships', getInternships);
router.post('/internships', validateBody(internshipSchema), createInternship);
router.get('/internships/:id', itemParams, getInternship);
router.put('/internships/:id', itemParams, validateBody(internshipSchema), updateInternship);
router.delete('/internships/:id', itemParams, deleteInternship);

router.get('/projects', getProjects);
router.post('/projects', validateBody(projectSchema), createProject);
router.get('/projects/:id', itemParams, getProject);
router.put('/projects/:id', itemParams, validateBody(projectSchema), updateProject);
router.delete('/projects/:id', itemParams, deleteProject);

export default router;
