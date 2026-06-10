import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { Response, NextFunction, Request } from 'express';

export type AuthLocals = {
  userId: string;
};

type JwtPayload = {
  userId: string;
};

export const authMiddleware = (
  req: Request,
  res: Response<any, AuthLocals>,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header) {
    throw new AppError('Unauthorized', 401);
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    res.locals.userId = decoded.userId;

    next();
  } catch {
    throw new AppError('Invalid token', 401);
  }
};
