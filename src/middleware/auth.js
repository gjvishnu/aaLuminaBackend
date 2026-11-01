import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const getSecret = (name) => {
  if (process.env[name]) {
    return process.env[name];
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured in production`);
  }

  console.warn(
    `${name} is not configured. A temporary development secret will be used; tokens expire when the server restarts.`,
  );
  return randomBytes(64).toString('hex');
};

const accessSecret = getSecret('JWT_ACCESS_SECRET');
const refreshSecret = getSecret('JWT_REFRESH_SECRET');
const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const jwtOptions = { algorithm: 'HS256' };

const signToken = (user, secret, expiresIn, tokenType) =>
  jwt.sign(
    {
      sub: user.userUuid,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
      tokenType,
    },
    secret,
    { ...jwtOptions, expiresIn },
  );

export const createAccessToken = (user) =>
  signToken(user, accessSecret, accessTokenExpiresIn, 'access');

export const createRefreshToken = (user) =>
  signToken(user, refreshSecret, refreshTokenExpiresIn, 'refresh');

export const verifyRefreshToken = (token) =>
  jwt.verify(token, refreshSecret, { algorithms: ['HS256'] });

const getBearerToken = (req) => {
  const authorization = req.get('authorization');

  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return null;
  }

  return authorization.replace(/^Bearer\s+/i, '').trim();
};

export const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required. Use Authorization: Bearer <access-token>',
    });
  }

  try {
    const payload = jwt.verify(token, accessSecret, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload === 'string' ||
      payload.tokenType !== 'access' ||
      typeof payload.sub !== 'string'
    ) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    const user = await prisma.user.findUnique({
      where: { userUuid: payload.sub },
      select: {
        userUuid: true,
        email: true,
        role: true,
        status: true,
        tokenVersion: true,
      },
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      payload.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired' });
    }

    return res.status(401).json({ message: 'Invalid access token' });
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
    });
  }

  return next();
};

