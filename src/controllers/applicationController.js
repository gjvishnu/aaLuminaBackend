import prisma from '../db.js';
import { applicationStatuses } from '../validators/applicationValidator.js';
import {
  eligibleRoleWhere,
  handleError,
  listRoleSelect,
  loadStudent,
  toJob,
} from './jobController.js';

const applicationSelect = {
  id: true,
  status: true,
  appliedAt: true,
  updatedAt: true,
  driveRole: { select: listRoleSelect },
};

// Applications stay visible even if the student no longer matches the job's skills,
// so the job is built without the skill-match requirement.
const formatApplication = (application, student) => {
  const { application: _ignored, ...job } = toJob(application.driveRole, student, {
    requireSkillMatch: false,
  });

  return {
    id: application.id,
    status: application.status,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
    job,
  };
};

export const getApplications = async (req, res) => {
  try {
    const { studentId, status, search, page, pageSize } = req.validatedQuery;
    const student = await loadStudent(studentId, req.user);

    const where = { studentId };
    if (status) where.status = status;

    if (search) {
      const contains = { contains: search, mode: 'insensitive' };
      where.driveRole = {
        OR: [
          { jobRole: contains },
          { jobLocation: contains },
          { drive: { company: { name: contains } } },
        ],
      };
    }

    const [total, applications, groupedCounts] = await prisma.$transaction([
      prisma.jobApplication.count({ where }),
      prisma.jobApplication.findMany({
        where,
        select: applicationSelect,
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { studentId },
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
    ]);

    const statusCounts = Object.fromEntries(applicationStatuses.map((value) => [value, 0]));
    for (const group of groupedCounts) {
      statusCounts[group.status] = group._count._all;
    }

    return res.status(200).json({
      data: applications.map((application) => formatApplication(application, student)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      statusCounts: {
        ALL: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        ...statusCounts,
      },
    });
  } catch (error) {
    return handleError(res, error, 'fetch applications');
  }
};

export const createApplication = async (req, res) => {
  try {
    const { studentId, roleId } = req.body;
    const student = await loadStudent(studentId, req.user);

    const roleExists = await prisma.driveRole.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!roleExists) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (student.applicationsByRoleId.has(roleId)) {
      return res.status(409).json({ message: 'You have already applied for this job' });
    }

    // Same rules as the Jobs screen: a student can only apply to a job they can see.
    const role = await prisma.driveRole.findFirst({
      where: { id: roleId, ...eligibleRoleWhere(student) },
      select: listRoleSelect,
    });

    if (!role || !toJob(role, student)) {
      return res.status(400).json({
        message: 'You are not eligible for this job, or applications for it are closed',
      });
    }

    const application = await prisma.jobApplication.create({
      data: { studentId, driveRoleId: roleId },
      select: applicationSelect,
    });

    return res.status(201).json(formatApplication(application, student));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'You have already applied for this job' });
    }

    return handleError(res, error, 'apply for job');
  }
};
