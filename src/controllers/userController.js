import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import prisma from '../db.js';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.js';

const scryptAsync = promisify(scrypt);
const userRoles = ['STUDENT', 'PLACEMENT_OFFICER', 'ADMIN', 'RECRUITER'];
const plainTextAdminEmail = 'admin@lm.com';

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

const verifyPassword = async (password, storedPassword) => {
  const [salt, storedKeyHex] = storedPassword.split(':');

  if (
    !salt ||
    !storedKeyHex ||
    storedKeyHex.length % 2 !== 0 ||
    !/^[a-f0-9]+$/i.test(storedKeyHex)
  ) {
    return false;
  }

  const storedKey = Buffer.from(storedKeyHex, 'hex');
  const derivedKey = await scryptAsync(password, salt, storedKey.length);

  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
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

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        ...publicUserFields,
        password: true,
        tokenVersion: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // This existing admin record stores its password as plain text.
    // All other users continue to use the hashed-password verification.
    const passwordMatches =
      user.email === plainTextAdminEmail
        ? user.password === password
        : await verifyPassword(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const {
      password: _password,
      tokenVersion: _tokenVersion,
      ...safeUser
    } = user;

    return res.status(200).json({
      message: 'Login successful',
      user: safeUser,
      accessToken: createAccessToken({ ...safeUser, tokenVersion: user.tokenVersion }),
      refreshToken: createRefreshToken({ ...safeUser, tokenVersion: user.tokenVersion }),
      tokenType: 'Bearer',
    });
  } catch (error) {
    console.error('Failed to login user:', error.message);
    return res.status(500).json({ message: 'Failed to login user' });
  }
};

export const refreshUserToken = async (req, res) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const payload = verifyRefreshToken(refreshToken);

    if (
      typeof payload === 'string' ||
      payload.tokenType !== 'refresh' ||
      typeof payload.sub !== 'string'
    ) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { userUuid: payload.sub },
      select: {
        ...publicUserFields,
        tokenVersion: true,
      },
    });

    if (!user || payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: 'Your refresh session is invalid or expired. Please log in again.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        message: 'Your account is inactive. Please contact the administrator.',
      });
    }

    return res.status(200).json({
      accessToken: createAccessToken(user),
      refreshToken: createRefreshToken(user),
      tokenType: 'Bearer',
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    await prisma.user.update({
      where: { userUuid: req.user.userUuid },
      data: { tokenVersion: { increment: 1 } },
    });

    return res.status(200).json({
      message: 'Logout successful. All active tokens have been invalidated.',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(401).json({
        message: 'Your account could not be found. Please log in again.',
      });
    }

    console.error('Failed to logout user:', error.message);
    return res.status(500).json({ message: 'Failed to logout user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userUuid } = req.params;
    const { email, password, role, status } = req.body ?? {};
    const data = {};

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
        return res.status(400).json({ message: 'A valid email is required' });
      }
      data.email = email.trim().toLowerCase();
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters long',
        });
      }
      data.password = await hashPassword(password);
    }

    if (role !== undefined) {
      if (!userRoles.includes(role)) {
        return res.status(400).json({
          message: `Role must be one of: ${userRoles.join(', ')}`,
        });
      }
      data.role = role;
    }

    if (status !== undefined) {
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({
          message: 'Status must be ACTIVE or INACTIVE',
        });
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'At least one user field is required to update',
      });
    }

    const user = await prisma.user.update({
      where: { userUuid },
      data,
      select: publicUserFields,
    });

    return res.status(200).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }

    console.error('Failed to update user:', error.message);
    return res.status(500).json({ message: 'Failed to update user' });
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
