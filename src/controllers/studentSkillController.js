import prisma from '../db.js';

export const skillFields = {
  id: true,
  skill: true,
  category: true,
  domain: true,
  status: true,
};

const listSkills = async (client, studentId) => {
  const rows = await client.studentSkill.findMany({
    where: { studentId },
    select: { skill: { select: skillFields } },
    orderBy: { skill: { skill: 'asc' } },
  });

  return rows.map(({ skill }) => skill);
};

export const getStudentSkills = async (req, res) => {
  try {
    return res.status(200).json(await listSkills(prisma, req.params.studentId));
  } catch (error) {
    console.error('Failed to fetch student skills:', error.message);
    return res.status(500).json({ message: 'Failed to fetch student skills' });
  }
};

export const addStudentSkill = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { skillId } = req.body;

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: skillFields,
    });

    if (!skill || skill.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Active skill not found' });
    }

    await prisma.studentSkill.create({ data: { studentId, skillId } });

    return res.status(201).json(skill);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Skill already added' });
    }

    console.error('Failed to add student skill:', error.message);
    return res.status(500).json({ message: 'Failed to add student skill' });
  }
};

export const replaceStudentSkills = async (req, res) => {
  try {
    const { studentId } = req.params;
    const skillIds = [...new Set(req.body.skillIds)];

    // A skill deactivated after the student added it can stay on their list.
    const allowedSkills = await prisma.skill.findMany({
      where: {
        id: { in: skillIds },
        OR: [{ status: 'ACTIVE' }, { students: { some: { studentId } } }],
      },
      select: { id: true },
    });

    if (allowedSkills.length !== skillIds.length) {
      const allowed = new Set(allowedSkills.map(({ id }) => id));
      const missing = skillIds.find((skillId) => !allowed.has(skillId));
      return res.status(404).json({ message: `Active skill not found: ${missing}` });
    }

    const skills = await prisma.$transaction(async (tx) => {
      await tx.studentSkill.deleteMany({ where: { studentId } });
      await tx.studentSkill.createMany({
        data: skillIds.map((skillId) => ({ studentId, skillId })),
      });

      return listSkills(tx, studentId);
    });

    return res.status(200).json(skills);
  } catch (error) {
    console.error('Failed to update student skills:', error.message);
    return res.status(500).json({ message: 'Failed to update student skills' });
  }
};

export const removeStudentSkill = async (req, res) => {
  try {
    const { studentId, skillId } = req.params;

    await prisma.studentSkill.delete({
      where: { studentId_skillId: { studentId, skillId } },
    });

    return res.status(200).json({ message: 'Skill removed successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Skill not found for this student' });
    }

    console.error('Failed to remove student skill:', error.message);
    return res.status(500).json({ message: 'Failed to remove student skill' });
  }
};
