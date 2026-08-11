import { ExportData, Exporter, GeneratedFile } from "./exporter.types.js";
import { AnswerValue, formatAnswer, slugifyFileName } from "./formatAnswer.js";

const escapeCsvCell = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const toCsvRow = (cells: string[]): string => cells.map(escapeCsvCell).join(",");

export const exportToCsv: Exporter = async (data: ExportData): Promise<GeneratedFile> => {
  const questions = [...data.questions].sort((a, b) => a.order - b.order);

  const header = ["Дата надсилання", ...questions.map((q) => q.text)];

  const rows = data.responses.map((response) => {
    const answers = response.answers as Record<string, AnswerValue>;

    const cells = [
      response.createdAt.toLocaleString("uk-UA"),
      ...questions.map((q) => formatAnswer(q, answers[q.id])),
    ];

    return toCsvRow(cells);
  });

  const csvContent = ["\uFEFF" + toCsvRow(header), ...rows].join("\r\n");

  return {
    buffer: Buffer.from(csvContent, "utf-8"),
    fileName: `${slugifyFileName(data.form.title)}-responses.csv`,
    mimeType: "text/csv; charset=utf-8",
  };
};
