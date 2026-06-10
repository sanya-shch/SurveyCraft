import { Request, Response, NextFunction } from 'express';

export class AppError<T = unknown> extends Error {
  statusCode: number;
  errors?: T;

  constructor(message: string, statusCode: number, errors?: T) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.errors ?? null,
    });
  }

  return res.status(500).json({
    message: 'Internal Server Error',
  });
};
