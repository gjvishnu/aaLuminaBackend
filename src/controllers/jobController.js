import prisma from '../db.js';
import { isStudentManager } from '../middleware/studentAccess.js';

// A "job" is a DriveRole: the role holds the job details and the eligibility
// criteria, and its drive holds the company and the apply-by date.

const OPEN_DRIVE_STATUSES = ['UPCOMING', 'ONGOING'];
const DAY_MS = 24 * 60 * 60 * 1000;

const accessDeniedMessage = 'You do not have permission to access this feature.';

export class JobAccessError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const skillFields = { id: true, skill: true, category: true, domain: true };

export const listRoleSelect = {
  id: true,
  jobRole: true,
  jobLocation: true,
  jobType: true,
  ctcPackage: true,
  numberOfOpenings: true,
  graduationYears: true,
  minimumCgpa: true,
  maximumBacklogs: true,
  degree: true,
  createdAt: true,
  skills: { select: { skill: { select: skillFields } } },
  drive: {
    select: {
      id: true,
      driveDate: true,
      driveTime: true,
      venue: true,
      registrationEndDate: true,
      status: true,
      company: { select: { id: true, name: true, website: true, location: true } },
    },
  },
};

const detailRoleSelect = {
  ...listRoleSelect,
  otherCriteria: true,
  jobDescription: true,
  jdPdfUrl: true,
  selectionProcesses: true,
  departments: { select: { department: { select: { id: true, name: true } } } },
};

const todayUtc = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Loads the student and checks the caller may see that student's jobs.
export const loadStudent = async (studentId, user) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      userUuid: true,
      departmentId: true,
      batch: true,
      cgpa: true,
      backlogs: true,
      status: true,
      skills: { select: { skillId: true } },
      applications: { select: { id: true, driveRoleId: true, status: true, appliedAt: true } },
    },
  });

  if (!student) {
    throw new JobAccessError('Student not found', 404);
  }

  if (!isStudentManager(user) && student.userUuid !== user.userUuid) {
    throw new JobAccessError(accessDeniedMessage, 403);
  }

  if (student.status !== 'ACTIVE') {
    throw new JobAccessError('Student is inactive', 403);
  }

  return {
    ...student,
    cgpa: student.cgpa === null ? null : Number(student.cgpa),
    skillIds: new Set(student.skills.map(({ skillId }) => skillId)),
    applicationsByRoleId: new Map(
      student.applications.map(({ driveRoleId, ...application }) => [driveRoleId, application]),
    ),
  };
};

// Profile fields that, while empty, hide every job that sets the matching criterion.
const missingProfileFields = (student) => {
  const missing = [];
  if (student.cgpa === null) missing.push('cgpa');
  if (student.backlogs === null) missing.push('backlogs');
  if (student.departmentId === null) missing.push('departmentId');
  if (student.batch === null) missing.push('batch');
  if (student.skillIds.size === 0) missing.push('skills');
  return missing;
};

// Database-side eligibility: open drive, active company, apply-by date not passed,
// and the student's cgpa, backlogs, department and graduation year meet the role.
// A criterion left empty on the role (null or no values) is open to everyone.
export const eligibleRoleWhere = (student) => ({
  drive: {
    status: { in: OPEN_DRIVE_STATUSES },
    company: { status: 'ACTIVE' },
    OR: [{ registrationEndDate: null }, { registrationEndDate: { gte: todayUtc() } }],
  },
  AND: [
    {
      OR: [
        { minimumCgpa: null },
        ...(student.cgpa === null ? [] : [{ minimumCgpa: { lte: student.cgpa } }]),
      ],
    },
    {
      OR: [
        { maximumBacklogs: null },
        ...(student.backlogs === null ? [] : [{ maximumBacklogs: { gte: student.backlogs } }]),
      ],
    },
    {
      OR: [
        { departments: { none: {} } },
        ...(student.departmentId === null
          ? []
          : [{ departments: { some: { departmentId: student.departmentId } } }]),
      ],
    },
    {
      OR: [
        { graduationYears: { isEmpty: true } },
        ...(student.batch === null ? [] : [{ graduationYears: { has: student.batch } }]),
      ],
    },
  ],
});

const matchLabel = (percentage) => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Great';
  if (percentage >= 60) return 'Good';
  return 'Fair';
};

// Skill matching: the student needs at least one of the role's skills; a role
// with no skills matches everyone at 100%. Returns null when the role does not match,
// unless requireSkillMatch is false (used for applications the student already made).
export const toJob = (role, student, { detail = false, requireSkillMatch = true } = {}) => {
  const skills = role.skills.map(({ skill }) => ({
    ...skill,
    matched: student.skillIds.has(skill.id),
  }));
  const matchedSkills = skills.filter((skill) => skill.matched).length;

  if (requireSkillMatch && skills.length > 0 && matchedSkills === 0) {
    return null;
  }

  const matchPercentage =
    skills.length === 0 ? 100 : Math.round((matchedSkills / skills.length) * 100);
  const applyBy = role.drive.registrationEndDate;

  const job = {
    id: role.id,
    jobRole: role.jobRole,
    jobLocation: role.jobLocation,
    jobType: role.jobType,
    ctcPackage: role.ctcPackage,
    numberOfOpenings: role.numberOfOpenings,
    company: role.drive.company,
    drive: {
      id: role.drive.id,
      driveDate: role.drive.driveDate,
      driveTime: role.drive.driveTime,
      venue: role.drive.venue,
      status: role.drive.status,
    },
    applyBy,
    daysLeft: applyBy ? Math.round((applyBy.getTime() - todayUtc().getTime()) / DAY_MS) : null,
    skills,
    match: {
      percentage: matchPercentage,
      label: matchLabel(matchPercentage),
      matchedSkills,
      totalSkills: skills.length,
    },
    eligibility: {
      minimumCgpa: role.minimumCgpa === null ? null : Number(role.minimumCgpa),
      maximumBacklogs: role.maximumBacklogs,
      graduationYears: role.graduationYears,
      degree: role.degree,
    },
    application: student.applicationsByRoleId.get(role.id) ?? null,
    createdAt: role.createdAt,
  };

  if (detail) {
    job.eligibility.departments = role.departments.map(({ department }) => department);
    job.eligibility.otherCriteria = role.otherCriteria;
    job.jobDescription = role.jobDescription;
    job.jdPdfUrl = role.jdPdfUrl;
    job.selectionProcesses = role.selectionProcesses;
  }

  return job;
};

const includesText = (value, text) =>
  typeof value === 'string' && value.toLowerCase().includes(text.toLowerCase());

const applyByTime = (job) => (job.applyBy ? job.applyBy.getTime() : Number.POSITIVE_INFINITY);

const sorters = {
  newest: (a, b) => b.createdAt - a.createdAt,
  applyBy: (a, b) => applyByTime(a) - applyByTime(b) || b.createdAt - a.createdAt,
  match: (a, b) =>
    b.match.percentage - a.match.percentage || applyByTime(a) - applyByTime(b),
};

const uniqueSorted = (values) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

// Options for the dropdown filters, built from every job the student is eligible for.
const buildFilterOptions = (jobs) => {
  const companies = new Map(jobs.map((job) => [job.company.id, job.company.name]));

  return {
    companies: [...companies]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    jobRoles: uniqueSorted(jobs.map((job) => job.jobRole)),
    jobLocations: uniqueSorted(jobs.map((job) => job.jobLocation)),
    jobTypes: uniqueSorted(jobs.map((job) => job.jobType)),
  };
};

export const handleError = (res, error, action) => {
  if (error instanceof JobAccessError) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error(`Failed to ${action}:`, error.message);
  return res.status(500).json({ message: `Failed to ${action}` });
};

export const getJobs = async (req, res) => {
  try {
    const {
      studentId,
      page,
      pageSize,
      search,
      companyId,
      jobRole,
      jobLocation,
      jobType,
      sortBy,
    } = req.validatedQuery;

    const student = await loadStudent(studentId, req.user);

    const roles = await prisma.driveRole.findMany({
      where: eligibleRoleWhere(student),
      select: listRoleSelect,
    });

    const eligibleJobs = roles.map((role) => toJob(role, student)).filter(Boolean);

    const filteredJobs = eligibleJobs.filter(
      (job) =>
        (!companyId || job.company.id === companyId) &&
        (!jobRole || includesText(job.jobRole, jobRole)) &&
        (!jobLocation || includesText(job.jobLocation, jobLocation)) &&
        (!jobType || job.jobType === jobType) &&
        (!search ||
          includesText(job.company.name, search) ||
          includesText(job.jobRole, search) ||
          includesText(job.jobLocation, search) ||
          job.skills.some((skill) => includesText(skill.skill, search))),
    );

    filteredJobs.sort(sorters[sortBy]);

    const total = filteredJobs.length;
    const data = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

    return res.status(200).json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filterOptions: buildFilterOptions(eligibleJobs),
      missingProfileFields: missingProfileFields(student),
    });
  } catch (error) {
    return handleError(res, error, 'fetch jobs');
  }
};

export const getJob = async (req, res) => {
  try {
    const { studentId } = req.validatedQuery;
    const student = await loadStudent(studentId, req.user);

    const role = await prisma.driveRole.findFirst({
      where: { id: req.params.roleId, ...eligibleRoleWhere(student) },
      select: detailRoleSelect,
    });

    const job = role && toJob(role, student, { detail: true });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or student is not eligible' });
    }

    return res.status(200).json(job);
  } catch (error) {
    return handleError(res, error, 'fetch job');
  }
};
