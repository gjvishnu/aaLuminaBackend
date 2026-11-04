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
