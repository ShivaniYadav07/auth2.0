import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export async function createUser({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(
      'An account with this email already exists',
      HTTP_STATUS.CONFLICT,
      'EMAIL_TAKEN',
    );
  }

  const passwordHash = await hashPassword(password);
  return User.create({ name, email, passwordHash });
}

export async function findUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
  }
  return user;
}

/**
 * Returns the user on success. On failure, always throws the same generic error whether
 * the email doesn't exist or the password is wrong - distinguishing the two would let an
 * attacker enumerate registered emails.
 */
export async function verifyCredentials(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const invalidCredentials = () =>
    new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, 'INVALID_CREDENTIALS');

  if (!user) throw invalidCredentials();

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) throw invalidCredentials();

  return user;
}
