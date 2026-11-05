import prisma from '../db.js';

const managerRoles = ['ADMIN', 'PLACEMENT_OFFICER'];

export const isStudentManager = (user) => managerRoles.includes(user.role);

// Lets a student reach only their own record; managers can reach any student.
export const requireStudentAccess = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      select: { userUuid: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.userUuid !== req.user.userUuid && !isStudentManager(req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to access this feature.',
      });
    }

    return next();
  } catch (error) {
    console.error('Failed to check student access:', error.message);
    return res.status(500).json({ message: 'Failed to check student access' });
  }
};

const accessDeniedMessage = 'You do not have permission to access this feature.';

// A student can only create their own record; managers can create any student's.
export const requireOwnStudentUser = (req, res, next) => {
  if (isStudentManager(req.user) || req.body?.userUuid === req.user.userUuid) {
    return next();
  }

  return res.status(403).json({ message: accessDeniedMessage });
};

// A student can only edit their own record and cannot change its registration
// number once it is created; managers can edit any student's record.
export const requireOwnStudentRecord = async (req, res, next) => {
  if (isStudentManager(req.user)) {
    return next();
  }

  if (req.body?.userUuid !== req.user.userUuid) {
    return res.status(403).json({ message: accessDeniedMessage });
  }

  if (req.body.registrationNumber !== undefined) {
    return res.status(403).json({ message: 'Registration number cannot be changed.' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      select: { userUuid: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.userUuid !== req.user.userUuid) {
      return res.status(403).json({ message: accessDeniedMessage });
    }

    return next();
  } catch (error) {
    console.error('Failed to check student access:', error.message);
    return res.status(500).json({ message: 'Failed to check student access' });
  }
};
