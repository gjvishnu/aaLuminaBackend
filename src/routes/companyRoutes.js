import { Router } from 'express';
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from '../controllers/companyController.js';

const router = Router();

router.get('/', getCompanies);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
