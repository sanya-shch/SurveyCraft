export type ExportFormat = "CSV" | "EXCEL" | "PDF";

export type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ExportJobDto {
  id: string;
  formId: string;
  format: ExportFormat;
  status: ExportStatus;
  fileName: string | null;
  responseCount: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
