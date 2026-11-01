import prisma from '../db.js';

class DriveInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const companyFields = {
  id: true,
  name: true,
  website: true,
  location: true,
  status: true,
};

const departmentFields = {
  id: true,
  name: true,
  status: true,
};

const skillFields = {
  id: true,
  skill: true,
  category: true,
  domain: true,
  status: true,
};

const roleDetailInclude = {
  departments: {
    include: { department: { select: departmentFields } },
  },
  skills: {
    include: { skill: { select: skillFields } },
  },
};

const driveDetailInclude = {
  company: { select: companyFields },
  roles: {
    orderBy: { createdAt: 'asc' },
    include: roleDetailInclude,
  },
};

const dateOnly = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const formatRole = (role) => ({
  ...role,
  minimumCgpa: role.minimumCgpa === null ? null : Number(role.minimumCgpa),
  departments: role.departments?.map(({ department }) => department) ?? [],
  skills: role.skills?.map(({ skill }) => skill) ?? [],
});

const formatDrive = (drive) => ({
  ...drive,
  roles: drive.roles.map(formatRole),
});

const handleError = (res, error, resource) => {
  if (error instanceof DriveInputError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({ message: 'A duplicate record was detected' });
  }

  if (error.code === 'P2003') {
    return res.status(400).json({ message: 'A referenced record does not exist' });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ message: `${resource} not found` });
  }

  console.error(`${resource} request failed:`, error.message);
  return res.status(500).json({ message: `Failed to process ${resource.toLowerCase()} request` });
};

const ensureCompany = async (tx, companyId) => {
  const company = await tx.company.findUnique({
    where: { id: companyId },
    select: companyFields,
  });

  if (!company || company.status !== 'ACTIVE') {
    throw new DriveInputError('Active company not found', 404);
  }
};

const resolveDepartmentIds = async (tx, departmentIds) => {
  const departments = await tx.department.findMany({
    where: { id: { in: departmentIds }, status: 'ACTIVE' },
    select: { id: true },
  });

  const found = new Set(departments.map((department) => department.id));
  const missing = departmentIds.find((departmentId) => !found.has(departmentId));

  if (missing) {
    throw new DriveInputError(`Active department not found: ${missing}`, 404);
  }

  return departmentIds;
};

const resolveSkillIds = async (tx, skillIds) => {
  if (skillIds.length === 0) {
    return [];
  }

  const skills = await tx.skill.findMany({
    where: { id: { in: skillIds }, status: 'ACTIVE' },
    select: { id: true },
  });

  const found = new Set(skills.map((skill) => skill.id));
  const missing = skillIds.find((skillId) => !found.has(skillId));

  if (missing) {
    throw new DriveInputError(`Active skill not found: ${missing}`, 404);
  }

  return skillIds;
};

const roleScalarData = (roleInput, includeDefaults = false) => {
  const data = {};
  const fields = [
    'jobRole',
    'jobLocation',
    'jobType',
    'ctcPackage',
    'numberOfOpenings',
    'graduationYears',
    'minimumCgpa',
    'maximumBacklogs',
    'degree',
    'otherCriteria',
    'jobDescription',
    'jdPdfUrl',
    'selectionProcesses',
  ];

  for (const field of fields) {
    if (includeDefaults || Object.hasOwn(roleInput, field)) {
      data[field] = roleInput[field] ?? null;
    }
  }

  if (includeDefaults) {
    data.jobLocation ??= null;
    data.minimumCgpa ??= null;
    data.maximumBacklogs ??= null;
    data.degree ??= null;
    data.jdPdfUrl ??= null;
  }

  return data;
};

const createRoleInTransaction = async (tx, driveId, roleInput) => {
  const departmentIds = await resolveDepartmentIds(tx, roleInput.departments);
  const skillIds = await resolveSkillIds(tx, roleInput.skillIds);

  const role = await tx.driveRole.create({
    data: {
      driveId,
      ...roleScalarData(roleInput, true),
    },
    select: { id: true },
  });

  if (departmentIds.length > 0) {
    await tx.driveRoleDepartment.createMany({
      data: departmentIds.map((departmentId) => ({
        driveRoleId: role.id,
        departmentId,
      })),
    });
  }

  if (skillIds.length > 0) {
    await tx.driveRoleSkill.createMany({
      data: skillIds.map((skillId) => ({
        driveRoleId: role.id,
        skillId,
      })),
    });
  }

  return role.id;
};

const getDriveInTransaction = (tx, id) =>
  tx.campusDrive.findUnique({
    where: { id },
    include: driveDetailInclude,
  });

export const createDrive = async (req, res) => {
  try {
    const input = req.body;
    const drive = await prisma.$transaction(async (tx) => {
      await ensureCompany(tx, input.companyId);

      const createdDrive = await tx.campusDrive.create({
        data: {
          companyId: input.companyId,
          driveDate: input.driveDate,
          driveTime: input.driveTime,
          venue: input.venue,
          registrationEndDate: input.registrationEndDate ?? null,
          status: input.status,
        },
      });

      for (const role of input.roles) {
        await createRoleInTransaction(tx, createdDrive.id, role);
      }

      return getDriveInTransaction(tx, createdDrive.id);
    });

    return res.status(201).json(formatDrive(drive));
  } catch (error) {
    return handleError(res, error, 'Campus drive');
  }
};

export const listDrives = async (req, res) => {
  try {
    const {
      page,
      pageSize,
      companyId,
      status,
      driveDate,
      driveDateFrom,
      driveDateTo,
      jobRole,
      jobType,
    } = req.validatedQuery ?? req.query;

    const driveWhere = {};

    if (companyId) driveWhere.companyId = companyId;
    if (status) driveWhere.status = status;

    if (driveDate || driveDateFrom || driveDateTo) {
      driveWhere.driveDate = {};
      if (driveDate) {
        driveWhere.driveDate.equals = dateOnly(driveDate);
      } else {
        if (driveDateFrom) driveWhere.driveDate.gte = dateOnly(driveDateFrom);
        if (driveDateTo) driveWhere.driveDate.lte = dateOnly(driveDateTo);
      }
    }

    const roleWhere = { drive: driveWhere };

    if (jobRole || jobType) {
      if (jobRole) roleWhere.jobRole = { contains: jobRole, mode: 'insensitive' };
      if (jobType) roleWhere.jobType = jobType;
    }

    const [total, roles] = await prisma.$transaction([
      prisma.driveRole.count({ where: roleWhere }),
      prisma.driveRole.findMany({
        where: roleWhere,
        select: {
          id: true,
          jobRole: true,
          jobLocation: true,
          jobType: true,
          ctcPackage: true,
          numberOfOpenings: true,
          drive: {
            select: {
              id: true,
              companyId: true,
              driveDate: true,
              driveTime: true,
              venue: true,
              registrationEndDate: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              company: { select: companyFields },
            },
          },
        },
        orderBy: [
          { drive: { driveDate: 'asc' } },
          { drive: { driveTime: 'asc' } },
          { createdAt: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const data = roles.map((role) => ({
      id: role.drive.id,
      companyId: role.drive.companyId,
      driveDate: role.drive.driveDate,
      driveTime: role.drive.driveTime,
      venue: role.drive.venue,
      registrationEndDate: role.drive.registrationEndDate,
      status: role.drive.status,
      createdAt: role.drive.createdAt,
      updatedAt: role.drive.updatedAt,
      company: role.drive.company,
      roles: [
        {
          id: role.id,
          jobRole: role.jobRole,
          jobLocation: role.jobLocation,
          jobType: role.jobType,
          ctcPackage: role.ctcPackage,
          numberOfOpenings: role.numberOfOpenings,
        },
      ],
    }));

    return res.status(200).json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return handleError(res, error, 'Campus drive');
  }
};

export const getDrive = async (req, res) => {
  try {
    const drive = await prisma.campusDrive.findUnique({
      where: { id: req.params.id },
      include: driveDetailInclude,
    });

    if (!drive) {
      return res.status(404).json({ message: 'Campus drive not found' });
    }

    return res.status(200).json(formatDrive(drive));
  } catch (error) {
    return handleError(res, error, 'Campus drive');
  }
};

export const updateDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const input = req.body;

    if (Object.keys(input).length === 0) {
      return res.status(400).json({ message: 'At least one drive field is required to update' });
    }

    const drive = await prisma.$transaction(async (tx) => {
      if (input.companyId) await ensureCompany(tx, input.companyId);

      await tx.campusDrive.update({
        where: { id },
        data: input,
      });

      return getDriveInTransaction(tx, id);
    });

    return res.status(200).json(formatDrive(drive));
  } catch (error) {
    return handleError(res, error, 'Campus drive');
  }
};

export const deleteDrive = async (req, res) => {
  try {
    await prisma.campusDrive.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'Campus drive deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Campus drive');
  }
};

export const addRole = async (req, res) => {
  try {
    const role = await prisma.$transaction(async (tx) => {
      const drive = await tx.campusDrive.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });

      if (!drive) {
        throw new DriveInputError('Campus drive not found', 404);
      }

      const roleId = await createRoleInTransaction(tx, drive.id, req.body);
      return tx.driveRole.findUnique({
        where: { id: roleId },
        include: roleDetailInclude,
      });
    });

    return res.status(201).json(formatRole(role));
  } catch (error) {
    return handleError(res, error, 'Drive role');
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id: driveId, roleId } = req.params;
    const input = req.body;
    const relationFields = ['departments', 'skillIds'];
    const scalarInput = { ...input };
    relationFields.forEach((field) => delete scalarInput[field]);

    if (Object.keys(input).length === 0) {
      return res.status(400).json({ message: 'At least one role field is required to update' });
    }

    const role = await prisma.$transaction(async (tx) => {
      const existingRole = await tx.driveRole.findFirst({
        where: { id: roleId, driveId },
        select: { id: true },
      });

      if (!existingRole) {
        throw new DriveInputError('Drive role not found for this campus drive', 404);
      }

      if (Object.keys(scalarInput).length > 0) {
        await tx.driveRole.update({
          where: { id: roleId },
          data: roleScalarData(scalarInput),
        });
      }

      if (input.departments !== undefined) {
        const departmentIds = await resolveDepartmentIds(tx, input.departments);
        await tx.driveRoleDepartment.deleteMany({ where: { driveRoleId: roleId } });
        if (departmentIds.length > 0) {
          await tx.driveRoleDepartment.createMany({
            data: departmentIds.map((departmentId) => ({ driveRoleId: roleId, departmentId })),
          });
        }
      }

      if (input.skillIds !== undefined) {
        const skillIds = await resolveSkillIds(tx, input.skillIds);
        await tx.driveRoleSkill.deleteMany({ where: { driveRoleId: roleId } });
        if (skillIds.length > 0) {
          await tx.driveRoleSkill.createMany({
            data: skillIds.map((skillId) => ({ driveRoleId: roleId, skillId })),
          });
        }
      }

      return tx.driveRole.findUnique({
        where: { id: roleId },
        include: roleDetailInclude,
      });
    });

    return res.status(200).json(formatRole(role));
  } catch (error) {
    return handleError(res, error, 'Drive role');
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await prisma.driveRole.findFirst({
      where: { id: req.params.roleId, driveId: req.params.id },
      select: { id: true },
    });

    if (!role) {
      return res.status(404).json({ message: 'Drive role not found for this campus drive' });
    }

    await prisma.driveRole.delete({ where: { id: role.id } });
    return res.status(200).json({ message: 'Drive role deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Drive role');
  }
};
