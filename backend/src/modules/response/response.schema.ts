import { z } from "zod";

export const submitResponseSchema = z.object({
  // Опційно: якщо респондент autosave-ився під час проходження (той самий
  // sessionKey, що й у PUT /:shareId/attempt), сервер позначить цю спробу
  // completedAt - funnel-аналітика бачитиме її як завершену, а не покинуту.
  sessionKey: z.string().min(1).max(100).optional(),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  ),
});
