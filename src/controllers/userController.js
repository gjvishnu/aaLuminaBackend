import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import prisma from '../db.js';

const scryptAsync = promisify(scrypt);
const userRoles = ['STUDENT', 'PLACEMENT_OFFICER', 'ADMIN', 'RECRUITER'];

const publicUserFields = {
  userUuid: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);

  return `${salt}:${derivedKey.toString('hex')}`;
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: publicUserFields,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        message: 'Email and password must be strings',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long',
      });
    }

    if (!userRoles.includes(role)) {
      return res.status(400).json({
        message: `Role must be one of: ${userRoles.join(', ')}`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: await hashPassword(password),
        role,
      },
      select: publicUserFields,
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    console.error('Failed to create user:', error.message);
    return res.status(500).json({ message: 'Failed to create user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userUuid } = req.params;

    const user = await prisma.user.update({
      where: { userUuid },
      data: { status: 'INACTIVE' },
      select: publicUserFields,
    });

    return res.status(200).json({
      message: 'User marked as inactive',
      user,
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }

    console.error('Failed to delete user:', error.message);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};
