import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../shared/utils/jwt.js";
import { AppError } from "../../shared/middleware/errorHandler.js";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

/**
 * Спільна точка видачі пари токенів для register/login/refresh - раніше
 * register і login дублювали (і розсинхронізовували) цю логіку: register
 * ходив через generateToken (15 хв), а login підписував токен інлайново з
 * TTL 7 днів. Тепер джерело правди одне.
 */
const issueTokenPair = async (userId: string): Promise<TokenPair> => {
  const accessToken = generateAccessToken({ userId });
  const refresh = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: refresh.tokenHash,
      userId,
      expiresAt: refresh.expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
};

export const registerUser = async (email: string, password: string) => {
  const hashed = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: { email, password: hashed },
    });
  } catch (error: unknown) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    if (prismaError.code === "P2002") {
      throw new AppError("Email already in use", 409);
    }

    throw error;
  }

  const tokens = await issueTokenPair(user.id);

  return {
    ...tokens,
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
    throw new AppError("Invalid credentials", 401);
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const tokens = await issueTokenPair(user.id);

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

/**
 * Обмін refresh-токена на нову пару. Ротація: щойно прочитаний
 * refresh-токен одразу відкликається (revokedAt), перш ніж видати новий -
 * той самий сирий токен не можна "переграти" повторно, навіть якщо його
 * десь перехопили.
 */
export const refreshAccessToken = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is missing", 401);
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("Invalid refresh token", 401);
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(stored.userId);
};

/**
 * Реальний (а не no-op) logout: відкликає refresh-токен у БД. Сам
 * access-токен, як завжди з JWT, лишається технічно дійсним до свого
 * 15-хвилинного спливу - але без дійсного refresh-токена сесію більше не
 * можна продовжити.
 */
export const revokeRefreshToken = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
