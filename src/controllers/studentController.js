import prisma from '../db.js';

const publicStudentFields = {
  id: true,
  userUuid: true,
  name: true,
  registrationNumber: true,
  departmentId: true,
  degreeId: true,
  batch: true,
  semester: true,
  cgpa: true,
  backlogs: true,
  phone: true,
  dateOfBirth: true,
  location: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const isUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const isValidName = (value) =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 150;

const CGPA_ERROR_MESSAGE =
  'cgpa must be a number between 0 and 10 with at most 2 decimal places, or null';

// cgpa is optional: null clears it; otherwise 0–10 with up to 2 decimals (DECIMAL(4,2)).
const isValidCgpa = (value) =>
  value === null ||
  (typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10 &&
    Math.abs(Math.round(value * 100) - value * 100) < 1e-9);

const BACKLOGS_ERROR_MESSAGE = 'backlogs must be a whole number of 0 or more, or null';

// backlogs is optional: null clears it; otherwise a non-negative integer that fits a Postgres INTEGER.
const isValidBacklogs = (value) =>
  value === null || (Number.isInteger(value) && value >= 0 && value <= 2147483647);

// Prisma returns Decimal columns as Decimal objects (serialized as strings); expose a number.
const formatStudent = (student) =>
  student && {
    ...student,
    cgpa: student.cgpa === null ? null : Number(student.cgpa),
  };

const validateStudentUser = async (userUuid) => {
  if (!isUuid(userUuid)) {
    return { status: 400, message: 'A valid userUuid is required' };
  }

  const user = await prisma.user.findUnique({
    where: { userUuid },
    select: { role: true, status: true },
  });

  if (!user) {
    return { status: 404, message: 'User not found' };
  }

  if (user.role !== 'STUDENT' || user.status !== 'ACTIVE') {
    return {
      status: 403,
      message: 'Only active users with the STUDENT role can access this API',
    };
  }

  return null;
};

const validateDegree = async (degreeId) => {
  if (!isUuid(degreeId)) {
    return { status: 400, message: 'degreeId must be a valid UUID' };
  }

  const degree = await prisma.degree.findUnique({
    where: { id: degreeId },
    select: { status: true },
  });

  if (!degree || degree.status !== 'ACTIVE') {
    return { status: 400, message: 'Active degree not found' };
  }

  return null;
};

const parseDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: publicStudentFields,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(students.map(formatStudent));
  } catch (error) {
    console.error('Failed to fetch students:', error.message);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const { userId } = req.validatedQuery;

    if (req.user.role === 'STUDENT' && userId !== req.user.userUuid) {
      return res.status(403).json({
        message: 'You do not have permission to access this feature.',
      });
    }

    const userError = await validateStudentUser(userId);

    if (userError) {
      return res.status(userError.status).json({ message: userError.message });
    }

    const student = await prisma.student.findUnique({
      where: { userUuid: userId },
      select: publicStudentFields,
    });

    return res.status(200).json({ freshUser: !student, student: formatStudent(student) });
  } catch (error) {
    console.error('Failed to fetch student profile:', error.message);
    return res.status(500).json({ message: 'Failed to fetch student profile' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const {
      userUuid,
      name,
      registrationNumber,
      departmentId,
      degreeId,
      batch,
      semester,
      cgpa,
      backlogs,
      phone,
      dateOfBirth,
      location,
    } = req.body;

    if (!userUuid || !registrationNumber) {
      return res.status(400).json({
        message: 'userUuid and registrationNumber are required',
      });
    }

    if (!isValidName(name)) {
      return res.status(400).json({
        message: 'name is required and can be up to 150 characters',
      });
    }

    const userError = await validateStudentUser(userUuid);

    if (userError) {
      return res.status(userError.status).json({ message: userError.message });
    }

    if (typeof registrationNumber !== 'string' || !registrationNumber.trim()) {
      return res.status(400).json({
        message: 'registrationNumber is required',
      });
    }

    if (departmentId !== undefined && departmentId !== null && !isUuid(departmentId)) {
      return res.status(400).json({ message: 'departmentId must be a valid UUID' });
    }

    if (degreeId !== undefined && degreeId !== null) {
      const degreeError = await validateDegree(degreeId);

      if (degreeError) {
        return res.status(degreeError.status).json({ message: degreeError.message });
      }
    }

    if (cgpa !== undefined && !isValidCgpa(cgpa)) {
      return res.status(400).json({ message: CGPA_ERROR_MESSAGE });
    }

    if (backlogs !== undefined && !isValidBacklogs(backlogs)) {
      return res.status(400).json({ message: BACKLOGS_ERROR_MESSAGE });
    }

    const parsedDateOfBirth = parseDate(dateOfBirth);

    if (dateOfBirth && !parsedDateOfBirth) {
      return res.status(400).json({ message: 'dateOfBirth must be a valid date' });
    }

    const student = await prisma.student.create({
      data: {
        userUuid,
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
        departmentId: departmentId || null,
        degreeId: degreeId ?? null,
        batch: batch ?? null,
        semester: semester ?? null,
        cgpa: cgpa ?? null,
        backlogs: backlogs ?? null,
        phone: phone || null,
        dateOfBirth: parsedDateOfBirth,
        location: location || null,
      },
      select: publicStudentFields,
    });

    return res.status(201).json(formatStudent(student));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'A student already exists for this user or registration number already exists',
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Department not found' });
    }

    console.error('Failed to create student:', error.message);
    return res.status(500).json({ message: 'Failed to create student' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userUuid,
      name,
      registrationNumber,
      departmentId,
      degreeId,
      batch,
      semester,
      cgpa,
      backlogs,
      phone,
      dateOfBirth,
      location,
    } = req.body;

    if (!userUuid) {
      return res.status(400).json({ message: 'userUuid is required' });
    }

    const userError = await validateStudentUser(userUuid);

    if (userError) {
      return res.status(userError.status).json({ message: userError.message });
    }

    const data = {};

    if (name !== undefined) {
      if (!isValidName(name)) {
        return res.status(400).json({
          message: 'name cannot be empty and can be up to 150 characters',
        });
      }
      data.name = name.trim();
    }

    if (registrationNumber !== undefined) {
      if (typeof registrationNumber !== 'string' || !registrationNumber.trim()) {
        return res.status(400).json({ message: 'registrationNumber cannot be empty' });
      }
      data.registrationNumber = registrationNumber.trim();
    }

    if (departmentId !== undefined) {
      if (departmentId !== null && !isUuid(departmentId)) {
        return res.status(400).json({ message: 'departmentId must be a valid UUID' });
      }
      data.departmentId = departmentId;
    }

    if (degreeId !== undefined) {
      if (degreeId !== null) {
        const degreeError = await validateDegree(degreeId);

        if (degreeError) {
          return res.status(degreeError.status).json({ message: degreeError.message });
        }
      }
      data.degreeId = degreeId;
    }

    if (batch !== undefined) data.batch = batch;
    if (semester !== undefined) data.semester = semester;

    if (cgpa !== undefined) {
      if (!isValidCgpa(cgpa)) {
        return res.status(400).json({ message: CGPA_ERROR_MESSAGE });
      }
      data.cgpa = cgpa;
    }

    if (backlogs !== undefined) {
      if (!isValidBacklogs(backlogs)) {
        return res.status(400).json({ message: BACKLOGS_ERROR_MESSAGE });
      }
      data.backlogs = backlogs;
    }

    if (phone !== undefined) data.phone = phone || null;
    if (location !== undefined) data.location = location || null;

    if (dateOfBirth !== undefined) {
      const parsedDateOfBirth = parseDate(dateOfBirth);

      if (dateOfBirth && !parsedDateOfBirth) {
        return res.status(400).json({ message: 'dateOfBirth must be a valid date' });
      }

      data.dateOfBirth = parsedDateOfBirth;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'At least one student field is required to update',
      });
    }

    const student = await prisma.student.update({
      where: { id },
      data,
      select: publicStudentFields,
    });

    return res.status(200).json(formatStudent(student));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Registration number already exists' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Department not found' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.error('Failed to update student:', error.message);
    return res.status(500).json({ message: 'Failed to update student' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: publicStudentFields,
    });

    return res.status(200).json({
      message: 'Student marked as inactive',
      student: formatStudent(student),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.error('Failed to delete student:', error.message);
    return res.status(500).json({ message: 'Failed to delete student' });
  }
};
