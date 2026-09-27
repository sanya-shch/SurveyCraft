import { z } from "zod";
import { ErrorCode } from "@surveycraft/shared-types";

/**
 * Політика складності пароля застосовується лише при РЕЄСТРАЦІЇ. Раніше
 * той самий min(6) стояв і на логіні - тобто якщо політику колись
 * посилити, існуючі користувачі зі старими паролями миттєво втратили б
 * змогу залогінитись, хоча пароль ніхто не міняв. Логін нижче лише
 * перевіряє, що пароль взагалі передано.
 *
 * Повідомлення - стабільні коди (ErrorCode), а не готовий текст: переклад
 * на фронтенді через i18next (react-frontend/src/i18n/errorCodes.ts).
 */
const registerPasswordSchema = z
  .string()
  .min(8, ErrorCode.VALIDATION_PASSWORD_TOO_SHORT)
  .regex(/[a-z]/, ErrorCode.VALIDATION_PASSWORD_NO_LOWERCASE)
  .regex(/[A-Z]/, ErrorCode.VALIDATION_PASSWORD_NO_UPPERCASE)
  .regex(/[0-9]/, ErrorCode.VALIDATION_PASSWORD_NO_DIGIT);

export const registerSchema = z.object({
  email: z.string().email(ErrorCode.VALIDATION_EMAIL_INVALID),
  password: registerPasswordSchema,
});

export const loginSchema = z.object({
  email: z.string().email(ErrorCode.VALIDATION_EMAIL_INVALID),
  password: z.string().min(1, ErrorCode.VALIDATION_PASSWORD_REQUIRED),
});
