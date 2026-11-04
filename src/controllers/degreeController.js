import prisma from '../db.js';

const publicDegreeFields = {
  id: true,
  degreeName: true,
  status: true,
  createdAt: true,
};

export const getDegrees = async (req, res) => {
  try {
    const degrees = await prisma.degree.findMany({
      select: publicDegreeFields,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(degrees);
  } catch (error) {
    console.error('Failed to fetch degrees:', error.message);
    return res.status(500).json({ message: 'Failed to fetch degrees' });
  }
};

export const createDegree = async (req, res) => {
  try {
    const degree = await prisma.degree.create({
      data: { degreeName: req.body.degreeName },
      select: publicDegreeFields,
    });

    return res.status(201).json(degree);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Degree name already exists' });
    }

    console.error('Failed to create degree:', error.message);
    return res.status(500).json({ message: 'Failed to create degree' });
  }
};

export const updateDegree = async (req, res) => {
  try {
    const degree = await prisma.degree.update({
      where: { id: req.params.id },
      data: { degreeName: req.body.degreeName },
      select: publicDegreeFields,
    });

    return res.status(200).json(degree);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Degree name already exists' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Degree not found' });
    }

    console.error('Failed to update degree:', error.message);
    return res.status(500).json({ message: 'Failed to update degree' });
  }
};

export const deleteDegree = async (req, res) => {
  try {
    await prisma.degree.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' },
    });

    return res.status(200).json({ message: 'Degree marked as inactive' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Degree not found' });
    }

    console.error('Failed to delete degree:', error.message);
    return res.status(500).json({ message: 'Failed to delete degree' });
  }
};
