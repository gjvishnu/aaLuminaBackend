import { Router } from 'express';
import {
  createSkill,
  deleteSkill,
  getSkills,
} from '../controllers/skillController.js';

const router = Router();

router.get('/', getSkills);
router.post('/', createSkill);
router.delete('/:id', deleteSkill);

export default router;
