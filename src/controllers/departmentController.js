import prisma from '../db.js';

const publicDepartmentFields = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: publicDepartmentFields,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error('Failed to fetch departments:', error.message);
    return res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'Department name is required',
      });
    }

    const department = await prisma.department.create({
      data: { name: name.trim() },
      select: publicDepartmentFields,
    });

    return res.status(201).json(department);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Department name already exists',
      });
    }

    console.error('Failed to create department:', error.message);
    return res.status(500).json({ message: 'Failed to create department' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'Department name is required',
      });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name: name.trim() },
      select: publicDepartmentFields,
    });

    return res.status(200).json(department);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Department name already exists',
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Department not found' });
    }

    console.error('Failed to update department:', error.message);
    return res.status(500).json({ message: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

     await prisma.department.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: publicDepartmentFields,
    });

    return res.status(200).json({
      message: 'Department marked as inactive',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Department not found' });
    }

    console.error('Failed to delete department:', error.message);
    return res.status(500).json({ message: 'Failed to delete department' });
  }
};
