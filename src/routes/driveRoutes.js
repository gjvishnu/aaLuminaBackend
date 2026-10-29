import { Router } from 'express';
import {
  addRole,
  createDrive,
  deleteDrive,
  deleteRole,
  getDrive,
  listDrives,
  updateDrive,
  updateRole,
} from '../controllers/driveController.js';
import { requireDriveManager } from '../middleware/driveAuthorization.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  createDriveSchema,
  driveQuerySchema,
  driveRoleSchema,
  idParamsSchema,
  roleParamsSchema,
  updateDriveSchema,
  updateRoleSchema,
} from '../validators/driveValidator.js';

const router = Router();

router.get('/', validateQuery(driveQuerySchema), listDrives);
router.get('/:id', validateParams(idParamsSchema), getDrive);

router.post(
  '/',
  requireDriveManager,
  validateBody(createDriveSchema),
  createDrive,
);
router.patch(
  '/:id',
  requireDriveManager,
  validateParams(idParamsSchema),
  validateBody(updateDriveSchema),
  updateDrive,
);
router.delete(
  '/:id',
  requireDriveManager,
  validateParams(idParamsSchema),
  deleteDrive,
);

router.post(
  '/:id/roles',
  requireDriveManager,
  validateParams(idParamsSchema),
  validateBody(driveRoleSchema),
  addRole,
);
router.patch(
  '/:id/roles/:roleId',
  requireDriveManager,
  validateParams(roleParamsSchema),
  validateBody(updateRoleSchema),
  updateRole,
);
router.delete(
  '/:id/roles/:roleId',
  requireDriveManager,
  validateParams(roleParamsSchema),
  deleteRole,
);

export default router;
