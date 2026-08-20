import { z } from "zod";
import { saveAttemptSchema } from "./attempt.schema.js";

export type SaveAttemptInput = z.infer<typeof saveAttemptSchema>;

export type SaveAttemptDto = {
  id: string;
  updatedAt: Date;
};
