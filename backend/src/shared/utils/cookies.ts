import { CookieOptions } from "express";
import { isProduction } from "../../config/env.js";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

/**
 * Refresh-токен живе лише в httpOnly cookie - недоступний з JS, а отже
 * недосяжний для XSS (на відміну від access-токена, який свідомо тримаємо
 * в пам'яті фронтенду, а не в localStorage). path обмежує cookie лише
 * ендпоінтами /api/auth, щоб браузер не тягав його в кожен інший запит.
 */
export const refreshTokenCookieOptions = (expiresAt: Date): CookieOptions => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax",
  path: "/api/auth",
  expires: expiresAt,
});

export const clearRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax",
  path: "/api/auth",
});
