import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);

  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password, storedPassword) => {
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
