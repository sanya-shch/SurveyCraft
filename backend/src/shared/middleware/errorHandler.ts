import { Request, Response, NextFunction } from "express";
import { ErrorCode } from "@surveycraft/shared-types";

export class AppError<T = unknown> extends Error {
  statusCode: number;
  errors?: T;

  // message - завжди ErrorCode (стабільний рядок-ідентифікатор), а НЕ
  // готовий текст для показу користувачу - переклад на фронтенді. Тип
  // лишається `string`, а не `ErrorCode`, щоб не блокувати рідкісні місця,
  // де під `errors` йде довільна структура (напр. Zod-issues) з власним
  // текстом усередині - сам код помилки все одно обирається з ErrorCode.
  constructor(message: string, statusCode: number, errors?: T) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.errors ?? null,
    });
  }

  console.error(err);

  return res.status(500).json({
    message: ErrorCode.INTERNAL_SERVER_ERROR,
  });
};
