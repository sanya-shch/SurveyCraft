import { z } from "zod";
import { ExportFormat, ExportStatus } from "@prisma/client";
import { createExportSchema } from "./export.schema.js";

export type CreateExportInput = z.infer<typeof createExportSchema>;

export type ExportJobDto = {
  id: string;
  formId: string;
  format: ExportFormat;
  status: ExportStatus;
  fileName: string | null;
  responseCount: number | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type ExportQueueJobData = {
  exportJobId: string;
};
