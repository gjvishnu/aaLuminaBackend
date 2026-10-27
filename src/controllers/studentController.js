import prisma from '../db.js';

const publicStudentFields = {
  id: true,
  userUuid: true,
  registrationNumber: true,
  departmentId: true,
  program: true,
  batch: true,
  semester: true,
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

    return res.status(200).json(students);
  } catch (error) {
    console.error('Failed to fetch students:', error.message);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const {
      userUuid,
      registrationNumber,
      departmentId,
      program,
      batch,
      semester,
      phone,
      dateOfBirth,
      location,
    } = req.body;

    if (!userUuid || !registrationNumber) {
      return res.status(400).json({
        message: 'userUuid and registrationNumber are required',
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

    const parsedDateOfBirth = parseDate(dateOfBirth);

    if (dateOfBirth && !parsedDateOfBirth) {
      return res.status(400).json({ message: 'dateOfBirth must be a valid date' });
    }

    const student = await prisma.student.create({
      data: {
        userUuid,
        registrationNumber: registrationNumber.trim(),
        departmentId: departmentId || null,
        program: program || null,
        batch: batch ?? null,
        semester: semester ?? null,
        phone: phone || null,
        dateOfBirth: parsedDateOfBirth,
        location: location || null,
      },
      select: publicStudentFields,
    });

    return res.status(201).json(student);
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
      registrationNumber,
      departmentId,
      program,
      batch,
      semester,
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

    if (program !== undefined) data.program = program || null;
    if (batch !== undefined) data.batch = batch;
    if (semester !== undefined) data.semester = semester;
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

    return res.status(200).json(student);
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
      student,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.error('Failed to delete student:', error.message);
    return res.status(500).json({ message: 'Failed to delete student' });
  }
};
