import { Router } from 'express';
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from '../controllers/companyController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getCompanies);
router.post('/', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), createCompany);
router.put('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), updateCompany);
router.delete('/:id', authorizeRoles('ADMIN', 'PLACEMENT_OFFICER'), deleteCompany);

export default router;
