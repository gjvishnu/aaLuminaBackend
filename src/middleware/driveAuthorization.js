import { authorizeRoles, requireAuth } from './auth.js';

export const requireDriveManager = (req, res, next) => {
  return requireAuth(req, res, () =>
    authorizeRoles('ADMIN', 'PLACEMENT_OFFICER')(req, res, next),
  );
};
