import prisma from '../db.js';

const publicSkillFields = {
  id: true,
  skill: true,
  category: true,
  domain: true,
  status: true,
  createdAt: true,
};

export const getSkills = async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      select: publicSkillFields,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(skills);
  } catch (error) {
    console.error('Failed to fetch skills:', error.message);
    return res.status(500).json({ message: 'Failed to fetch skills' });
  }
};

export const createSkill = async (req, res) => {
  try {
    const { skill, category, domain } = req.body;

    if (
      typeof skill !== 'string' ||
      !skill.trim() ||
      typeof category !== 'string' ||
      !category.trim() ||
      typeof domain !== 'string' ||
      !domain.trim()
    ) {
      return res.status(400).json({
        message: 'Skill, category, and domain are required',
      });
    }

    const createdSkill = await prisma.skill.create({
      data: {
        skill: skill.trim(),
        category: category.trim(),
        domain: domain.trim(),
      },
      select: publicSkillFields,
    });

    return res.status(201).json(createdSkill);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Skill already exists' });
    }

    console.error('Failed to create skill:', error.message);
    return res.status(500).json({ message: 'Failed to create skill' });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

     await prisma.skill.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: publicSkillFields,
    });

    return res.status(200).json({
      message: 'Skill marked as inactive',
      
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Skill not found' });
    }

    console.error('Failed to delete skill:', error.message);
    return res.status(500).json({ message: 'Failed to delete skill' });
  }
};
