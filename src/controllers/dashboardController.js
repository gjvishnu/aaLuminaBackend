import prisma from '../db.js';
import {
  OPEN_DRIVE_STATUSES,
  eligibleRoleWhere,
  handleError,
  listRoleSelect,
  loadStudent,
  toJob,
} from './jobController.js';

// Profile Completion and Placement Readiness use the same formulas as the student
// profile screen (luminaMock: components/student/shared/helpers.ts), so the dashboard
// and the profile screen always show the same numbers.
//
// The resume, extracurriculars, sports and awards sections are not stored by the
// backend yet, so they always count as not done.

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const roundTo2 = (value) => Math.round(value * 100) / 100;

const getProfileFlags = (profile, student) => ({
  hasCgpa: student.cgpa !== null,
  hasResume: false,
  hasSkills: student.skillIds.size > 0,
  hasProjects: profile._count.projects > 0,
  hasInternships: profile._count.internships > 0,
  hasExtracurriculars: false,
  hasSports: false,
  hasAwards: false,
});

// Personal details 20 (shared across 4 fields), CGPA 20, resume 25,
// placement profile 25 (skills, projects, internships), activities 10
// (extracurriculars, sports, awards).
const buildProfileCompletion = (profile, flags) => {
  const personalFields = {
    // The profile screen falls back to a name built from the account email, so the
    // name always counts as filled in.
    name: hasText(profile.name) || hasText(profile.user.email),
    phone: hasText(profile.phone),
    dateOfBirth: profile.dateOfBirth !== null,
    location: hasText(profile.location),
  };
  const personalFilled = Object.values(personalFields).filter(Boolean).length;
  const placementFilled = [flags.hasSkills, flags.hasProjects, flags.hasInternships].filter(
    Boolean,
  ).length;
  const activitiesFilled = [flags.hasExtracurriculars, flags.hasSports, flags.hasAwards].filter(
    Boolean,
  ).length;

  const sections = [
    { key: 'personalDetails', weight: 20, earned: (personalFilled / 4) * 20 },
    { key: 'academicPerformance', weight: 20, earned: flags.hasCgpa ? 20 : 0 },
    { key: 'resume', weight: 25, earned: flags.hasResume ? 25 : 0 },
    { key: 'placementProfile', weight: 25, earned: (placementFilled / 3) * 25 },
    { key: 'activities', weight: 10, earned: (activitiesFilled / 3) * 10 },
  ];
  const total = sections.reduce((sum, section) => sum + section.earned, 0);

  const missingFields = [
    ...Object.entries(personalFields)
      .filter(([, filled]) => !filled)
      .map(([field]) => field),
    ...[
      ['cgpa', flags.hasCgpa],
      ['resume', flags.hasResume],
      ['skills', flags.hasSkills],
      ['projects', flags.hasProjects],
      ['internships', flags.hasInternships],
      ['extracurriculars', flags.hasExtracurriculars],
      ['sports', flags.hasSports],
      ['awards', flags.hasAwards],
    ]
      .filter(([, done]) => !done)
      .map(([field]) => field),
  ];

  return {
    percentage: Math.min(100, Math.round(total)),
    // Same items, order and labels as the "Profile checklist" on the profile screen.
    checklist: [
      { key: 'personalDetails', label: 'Personal Details', done: personalFilled === 4 },
      { key: 'internships', label: 'Internship Details', done: flags.hasInternships },
      { key: 'cgpa', label: 'CGPA', done: flags.hasCgpa },
      { key: 'resume', label: 'Resume', done: flags.hasResume },
      { key: 'skills', label: 'Skills', done: flags.hasSkills },
      { key: 'projects', label: 'Projects', done: flags.hasProjects },
    ],
    sections: sections.map((section) => ({ ...section, earned: roundTo2(section.earned) })),
    missingFields,
  };
};

// CGPA 25, resume 25, skills 20, projects 15, internships 15.
const READINESS_ITEMS = [
  { key: 'cgpa', flag: 'hasCgpa', weight: 25, label: 'CGPA', todoLabel: 'Add your CGPA' },
  { key: 'resume', flag: 'hasResume', weight: 25, label: 'Resume', todoLabel: 'Upload your resume' },
  { key: 'skills', flag: 'hasSkills', weight: 20, label: 'Skills', todoLabel: 'Add your skills' },
  { key: 'projects', flag: 'hasProjects', weight: 15, label: 'Projects', todoLabel: 'Add a project' },
  {
    key: 'internships',
    flag: 'hasInternships',
    weight: 15,
    label: 'Internships',
    todoLabel: 'Add internship details',
  },
];

const buildPlacementReadiness = (flags) => {
  // Same items, order and labels as the "Readiness checklist" on the profile screen.
  const checklist = READINESS_ITEMS.map(({ key, flag, weight, label, todoLabel }) => ({
    key,
    label: flags[flag] ? label : todoLabel,
    weight,
    done: flags[flag],
  }));

  return {
    percentage: checklist.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0),
    checklist,
  };
};

const roleWithDepartmentsSelect = {
  ...listRoleSelect,
  departments: { select: { department: { select: { id: true, name: true } } } },
};

const openRoleWhere = {
  drive: { status: { in: OPEN_DRIVE_STATUSES }, company: { status: 'ACTIVE' } },
};

const buildApplicationActivity = (groupedCounts) => {
  const count = (status) =>
    groupedCounts.find((group) => group.status === status)?._count._all ?? 0;
  const total = groupedCounts.reduce((sum, group) => sum + group._count._all, 0);

  return {
    total,
    applied: total,
    shortlisted: count('SHORTLISTED'),
    interviews: count('INTERVIEW'),
    offers: count('SELECTED'),
    rejected: count('REJECTED'),
    withdrawn: count('WITHDRAWN'),
  };
};

const toDriveItem = (job) => ({
  jobId: job.id,
  driveId: job.drive.id,
  company: { id: job.company.id, name: job.company.name },
  jobRole: job.jobRole,
  ctcPackage: job.ctcPackage,
  driveDate: job.drive.driveDate,
  driveTime: job.drive.driveTime,
  driveStatus: job.drive.status,
  applyBy: job.applyBy,
  daysLeft: job.daysLeft,
  application: job.application,
});

const buildUpcomingDrives = (jobs, limit) => {
  const sorted = [...jobs].sort(
    (a, b) =>
      a.drive.driveDate - b.drive.driveDate || a.drive.driveTime.localeCompare(b.drive.driveTime),
  );
  const drivesByStatus = (status) =>
    new Set(jobs.filter((job) => job.drive.status === status).map((job) => job.drive.id)).size;

  return {
    counts: {
      ongoing: drivesByStatus('ONGOING'),
      upcoming: drivesByStatus('UPCOMING'),
    },
    totalJobs: jobs.length,
    items: sorted.slice(0, limit).map(toDriveItem),
  };
};

const applyByTime = (job) => (job.applyBy ? job.applyBy.getTime() : Number.POSITIVE_INFINITY);

const buildRecommended = (eligibleJobs, departmentsByRoleId, limit) => {
  const notApplied = eligibleJobs.filter((job) => job.application === null);
  const sorted = [...notApplied].sort(
    (a, b) => b.match.percentage - a.match.percentage || applyByTime(a) - applyByTime(b),
  );

  return {
    total: notApplied.length,
    items: sorted.slice(0, limit).map((job) => ({
      jobId: job.id,
      driveId: job.drive.id,
      company: { id: job.company.id, name: job.company.name },
      jobRole: job.jobRole,
      ctcPackage: job.ctcPackage,
      match: job.match,
      departments: departmentsByRoleId.get(job.id) ?? [],
      graduationYears: job.eligibility.graduationYears,
      applyBy: job.applyBy,
      daysLeft: job.daysLeft,
    })),
  };
};

// Counts, for each skill, how many companies with open drives ask for it.
const buildSkillsInDemand = (openRoles, student, limit) => {
  const companiesBySkill = new Map();
  const allCompanies = new Set();

  for (const role of openRoles) {
    allCompanies.add(role.drive.companyId);
    for (const { skill } of role.skills) {
      const entry = companiesBySkill.get(skill.id) ?? { skill, companies: new Set() };
      entry.companies.add(role.drive.companyId);
      companiesBySkill.set(skill.id, entry);
    }
  }

  const items = [...companiesBySkill.values()]
    .map(({ skill, companies }) => ({
      skillId: skill.id,
      skill: skill.skill,
      companyCount: companies.size,
      studentHasSkill: student.skillIds.has(skill.id),
    }))
    .sort((a, b) => b.companyCount - a.companyCount || a.skill.localeCompare(b.skill));

  return {
    totalCompanies: allCompanies.size,
    totalSkills: items.length,
    items: items.slice(0, limit),
  };
};

export const getStudentDashboard = async (req, res) => {
  try {
    const { studentId, driveLimit, recommendedLimit, skillLimit } = req.validatedQuery;
    const student = await loadStudent(studentId, req.user);
    const appliedRoleIds = [...student.applicationsByRoleId.keys()];

    const [profile, eligibleRoles, appliedOpenRoles, openRoles, groupedCounts] =
      await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          select: {
            name: true,
            phone: true,
            dateOfBirth: true,
            location: true,
            user: { select: { email: true } },
            _count: { select: { projects: true, internships: true } },
          },
        }),
        prisma.driveRole.findMany({
          where: eligibleRoleWhere(student),
          select: roleWithDepartmentsSelect,
        }),
        // Open drives the student already applied to stay on the dashboard even after
        // the apply-by date passes or the student stops meeting the criteria.
        prisma.driveRole.findMany({
          where: { id: { in: appliedRoleIds }, ...openRoleWhere },
          select: roleWithDepartmentsSelect,
        }),
        prisma.driveRole.findMany({
          where: openRoleWhere,
          select: {
            skills: { select: { skill: { select: { id: true, skill: true } } } },
            drive: { select: { companyId: true } },
          },
        }),
        prisma.jobApplication.groupBy({
          by: ['status'],
          where: { studentId },
          _count: { _all: true },
          orderBy: { status: 'asc' },
        }),
      ]);

    const departmentsByRoleId = new Map(
      [...eligibleRoles, ...appliedOpenRoles].map((role) => [
        role.id,
        role.departments.map(({ department }) => department),
      ]),
    );

    const eligibleJobs = eligibleRoles.map((role) => toJob(role, student)).filter(Boolean);
    const eligibleRoleIds = new Set(eligibleJobs.map((job) => job.id));

    const driveJobs = [
      ...eligibleJobs,
      ...appliedOpenRoles
        .filter((role) => !eligibleRoleIds.has(role.id))
        .map((role) => toJob(role, student, { requireSkillMatch: false })),
    ];

    const flags = getProfileFlags(profile, student);

    return res.status(200).json({
      placementOverview: {
        profileCompletion: buildProfileCompletion(profile, flags),
        placementReadiness: buildPlacementReadiness(flags),
        applicationActivity: buildApplicationActivity(groupedCounts),
      },
      upcomingDrives: buildUpcomingDrives(driveJobs, driveLimit),
      recommendedJobs: buildRecommended(eligibleJobs, departmentsByRoleId, recommendedLimit),
      skillsInDemand: buildSkillsInDemand(openRoles, student, skillLimit),
    });
  } catch (error) {
    return handleError(res, error, 'fetch student dashboard');
  }
};
