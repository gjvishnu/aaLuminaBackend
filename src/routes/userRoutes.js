import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUsers,
  loginUser,
  logoutUser,
  refreshUserToken,
  updateUser,
} from '../controllers/userController.js';
import { authorizeRoles, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', loginUser);
router.post('/refresh', refreshUserToken);
router.post('/logout', requireAuth, logoutUser);

router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:userUuid', updateUser);
router.delete('/:userUuid', deleteUser);

export default router;
