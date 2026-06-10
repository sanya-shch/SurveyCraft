import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/prisma.js';
import { generateToken } from '../../shared/utils/jwt.js';
import { AppError } from '../../shared/middleware/errorHandler.js';

export const registerUser = async (email: string, password: string) => {
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  const token = generateToken({ userId: user.id });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

export const loginHandler = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};
