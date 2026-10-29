import prisma from '../db.js';

const managerRoles = ['PLACEMENT_OFFICER', 'ADMIN'];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const requireDriveManager = async (req, res, next) => {
  try {
    const userUuid = req.user?.userUuid || req.get('x-user-id');

    if (!userUuid) {
      return res.status(401).json({
        message: 'Authentication is required. Provide x-user-id or configure auth middleware.',
      });
    }

    if (!uuidPattern.test(userUuid)) {
      return res.status(401).json({ message: 'Invalid authenticated user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { userUuid },
      select: { userUuid: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    if (!managerRoles.includes(user.role)) {
      return res.status(403).json({
        message: 'Only placement officers and administrators can manage campus drives',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Drive authorization failed:', error.message);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};
