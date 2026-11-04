import prisma from '../db.js';
import { skillFields } from './studentSkillController.js';

const projectInclude = {
  technologies: {
    select: { skill: { select: skillFields } },
    orderBy: { skill: { skill: 'asc' } },
  },
};

const formatProject = (project) => ({
  ...project,
  technologies: project.technologies.map(({ skill }) => skill),
});

// Returns the first ID that is not usable. A skill deactivated after it was
// added to this project can stay on it.
const findInvalidSkillId = async (skillIds, projectId) => {
  const allowedSkills = await prisma.skill.findMany({
    where: {
      id: { in: skillIds },
      OR: [
        { status: 'ACTIVE' },
        ...(projectId ? [{ projects: { some: { projectId } } }] : []),
      ],
    },
    select: { id: true },
  });

  const allowed = new Set(allowedSkills.map(({ id }) => id));
  return skillIds.find((skillId) => !allowed.has(skillId));
};

export const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { studentId: req.params.studentId },
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(projects.map(formatProject));
  } catch (error) {
    console.error('Failed to fetch projects:', error.message);
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getProject = async (req, res) => {
  try {
    const { studentId, id } = req.params;
    const project = await prisma.project.findFirst({
      where: { id, studentId },
      include: projectInclude,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json(formatProject(project));
  } catch (error) {
    console.error('Failed to fetch project:', error.message);
    return res.status(500).json({ message: 'Failed to fetch project' });
  }
};

export const createProject = async (req, res) => {
  try {
    const { technologies, ...input } = req.body;
    const skillIds = [...new Set(technologies)];
    const invalidSkillId = await findInvalidSkillId(skillIds);

    if (invalidSkillId) {
      return res.status(404).json({ message: `Active skill not found: ${invalidSkillId}` });
    }

    const project = await prisma.project.create({
      data: {
        ...input,
        studentId: req.params.studentId,
        technologies: { create: skillIds.map((skillId) => ({ skillId })) },
      },
      include: projectInclude,
    });

    return res.status(201).json(formatProject(project));
  } catch (error) {
    console.error('Failed to create project:', error.message);
    return res.status(500).json({ message: 'Failed to create project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { studentId, id } = req.params;
    const { technologies, ...input } = req.body;
    const skillIds = [...new Set(technologies)];
    const invalidSkillId = await findInvalidSkillId(skillIds, id);

    if (invalidSkillId) {
      return res.status(404).json({ message: `Active skill not found: ${invalidSkillId}` });
    }

    const project = await prisma.project.update({
      where: { id, studentId },
      data: {
        ...input,
        technologies: {
          deleteMany: {},
          create: skillIds.map((skillId) => ({ skillId })),
        },
      },
      include: projectInclude,
    });

    return res.status(200).json(formatProject(project));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.error('Failed to update project:', error.message);
    return res.status(500).json({ message: 'Failed to update project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { studentId, id } = req.params;

    await prisma.project.delete({ where: { id, studentId } });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.error('Failed to delete project:', error.message);
    return res.status(500).json({ message: 'Failed to delete project' });
  }
};
