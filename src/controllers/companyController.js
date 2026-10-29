import prisma from '../db.js';

const publicCompanyFields = {
  id: true,
  name: true,
  website: true,
  location: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: publicCompanyFields,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(companies);
  } catch (error) {
    console.error('Failed to fetch companies:', error.message);
    return res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, website, location } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof location !== 'string' ||
      !location.trim()
    ) {
      return res.status(400).json({
        message: 'Name and location are required',
      });
    }

    if (website !== undefined && website !== null && typeof website !== 'string') {
      return res.status(400).json({ message: 'Website must be a string' });
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        website: website?.trim() || null,
        location: location.trim(),
      },
      select: publicCompanyFields,
    });

    return res.status(201).json(company);
  } catch (error) {
    console.error('Failed to create company:', error.message);
    return res.status(500).json({ message: 'Failed to create company' });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, location } = req.body;
    const data = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      data.name = name.trim();
    }

    if (location !== undefined) {
      if (typeof location !== 'string' || !location.trim()) {
        return res.status(400).json({ message: 'Location cannot be empty' });
      }
      data.location = location.trim();
    }

    if (website !== undefined) {
      if (website !== null && typeof website !== 'string') {
        return res.status(400).json({ message: 'Website must be a string' });
      }
      data.website = website?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'At least one company field is required to update',
      });
    }

    const company = await prisma.company.update({
      where: { id },
      data,
      select: publicCompanyFields,
    });

    return res.status(200).json(company);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Company not found' });
    }

    console.error('Failed to update company:', error.message);
    return res.status(500).json({ message: 'Failed to update company' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: publicCompanyFields,
    });

    return res.status(200).json({
      message: 'Company marked as inactive',
      company,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Company not found' });
    }

    console.error('Failed to delete company:', error.message);
    return res.status(500).json({ message: 'Failed to delete company' });
  }
};
