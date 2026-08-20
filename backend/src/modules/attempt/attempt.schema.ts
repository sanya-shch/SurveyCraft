import { z } from "zod";

export const saveAttemptSchema = z.object({
  // Клієнтський UUID цієї спроби проходження - генерується в браузері й
  // залишається стабільним для повторних autosave-викликів того самого
  // проходження (react-frontend, sessionStorage).
  sessionKey: z.string().min(1).max(100),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  ),
});
