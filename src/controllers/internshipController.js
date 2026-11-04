import prisma from '../db.js';
import { isStudentManager } from '../middleware/studentAccess.js';

export const getInternships = async (req, res) => {
  try {
    const internships = await prisma.internship.findMany({
      where: { studentId: req.params.studentId },
      orderBy: { startDate: 'desc' },
    });

    return res.status(200).json(internships);
  } catch (error) {
    console.error('Failed to fetch internships:', error.message);
    return res.status(500).json({ message: 'Failed to fetch internships' });
  }
};

export const getInternship = async (req, res) => {
  try {
    const { studentId, id } = req.params;
    const internship = await prisma.internship.findFirst({ where: { id, studentId } });

    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    return res.status(200).json(internship);
  } catch (error) {
    console.error('Failed to fetch internship:', error.message);
    return res.status(500).json({ message: 'Failed to fetch internship' });
  }
};

export const createInternship = async (req, res) => {
  try {
    const { isVerified, endDate, ...input } = req.body;

    const internship = await prisma.internship.create({
      data: {
        ...input,
        endDate: endDate ?? null,
        studentId: req.params.studentId,
        isVerified: isStudentManager(req.user) ? (isVerified ?? false) : false,
      },
    });

    return res.status(201).json(internship);
  } catch (error) {
    console.error('Failed to create internship:', error.message);
    return res.status(500).json({ message: 'Failed to create internship' });
  }
};

export const updateInternship = async (req, res) => {
  try {
    const { studentId, id } = req.params;
    const { isVerified, endDate, ...input } = req.body;

    const internship = await prisma.internship.update({
      where: { id, studentId },
      data: {
        ...input,
        endDate: endDate ?? null,
        // A student's edit changes what was verified, so it must be verified again.
        isVerified: isStudentManager(req.user) ? isVerified : false,
      },
    });

    return res.status(200).json(internship);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Internship not found' });
    }

    console.error('Failed to update internship:', error.message);
    return res.status(500).json({ message: 'Failed to update internship' });
  }
};

export const deleteInternship = async (req, res) => {
  try {
    const { studentId, id } = req.params;

    await prisma.internship.delete({ where: { id, studentId } });

    return res.status(200).json({ message: 'Internship deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Internship not found' });
    }

    console.error('Failed to delete internship:', error.message);
    return res.status(500).json({ message: 'Failed to delete internship' });
  }
};
