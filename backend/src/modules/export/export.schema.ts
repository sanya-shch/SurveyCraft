import { z } from "zod";

export const createExportSchema = z.object({
  format: z.enum(["CSV", "EXCEL", "PDF"]),
});
