import { Router } from 'express';
import {
  createSkill,
  deleteSkill,
  getSkills,
  updateSkill,
} from '../controllers/skillController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getSkills);
router.post('/', createSkill);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

export default router;
