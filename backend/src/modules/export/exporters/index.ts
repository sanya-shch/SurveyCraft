import { ExportFormat } from "@prisma/client";
import { Exporter } from "./exporter.types.js";
import { exportToCsv } from "./csv.exporter.js";
import { exportToExcel } from "./excel.exporter.js";
import { exportToPdf } from "./pdf.exporter.js";

export const exportersByFormat: Record<ExportFormat, Exporter> = {
  CSV: exportToCsv,
  EXCEL: exportToExcel,
  PDF: exportToPdf,
};

export * from "./exporter.types.js";
