import { Prisma } from '@prisma/client';

export const toJson = (value: unknown): Prisma.InputJsonValue => {
  return value as Prisma.InputJsonValue;
};
