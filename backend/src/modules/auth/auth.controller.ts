import { Request, Response } from 'express';
import { prisma } from '../../prisma/prisma.js';
import { loginHandler, registerUser } from './auth.service.js';
import {
  GetMeDto,
  LoginDto,
  LoginInput,
  RegisterDto,
  RegisterInput,
} from './auth.types.js';
import { AuthLocals } from '../../shared/middleware/auth.js';
import { AppError } from '../../shared/middleware/errorHandler.js';

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response<RegisterDto>
) => {
  const { email, password } = req.body;

  const result = await registerUser(email, password);

  res.json(result);
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response<LoginDto>
) => {
  const { email, password } = req.body;

  const result = await loginHandler(email, password);

  res.json(result);
};

export const getMeHandler = async (req: Request, res: Response<GetMeDto>) => {
  const userId = (res.locals as AuthLocals).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      // createdAt: true,
      // forms: true
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user);
};
