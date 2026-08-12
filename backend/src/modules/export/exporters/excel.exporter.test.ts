import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { exportToExcel } from "./excel.exporter.js";
import { buildExportData } from "./testFixtures.js";

const readWorkbook = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
};

describe("exportToExcel", () => {
  it('створює листи "Огляд" та "Відповіді"', async () => {
    const file = await exportToExcel(buildExportData());
    const workbook = await readWorkbook(file.buffer);

    expect(workbook.getWorksheet("Огляд")).toBeDefined();
    expect(workbook.getWorksheet("Відповіді")).toBeDefined();
  });

  it('лист "Огляд" містить назву форми та коректну кількість відповідей', async () => {
    const file = await exportToExcel(buildExportData());
    const workbook = await readWorkbook(file.buffer);
    const summary = workbook.getWorksheet("Огляд")!;

    const rows: Record<string, unknown> = {};
    summary.eachRow((row) => {
      const [, field, value] = row.values as unknown[];
      if (typeof field === "string") rows[field] = value;
    });

    expect(rows["Назва форми"]).toBe('Опитування "Сеньйор", 2026');
    expect(rows["Кількість відповідей"]).toBe(2);
    expect(rows["Кількість запитань"]).toBe(6);
  });

  it('лист "Огляд" показує "—" замість пустого опису форми', async () => {
    const file = await exportToExcel(
      buildExportData({ form: { id: "form-1", title: "Без опису", description: null } }),
    );
    const workbook = await readWorkbook(file.buffer);
    const summary = workbook.getWorksheet("Огляд")!;

    const rows: Record<string, unknown> = {};
    summary.eachRow((row) => {
      const [, field, value] = row.values as unknown[];
      if (typeof field === "string") rows[field] = value;
    });

    expect(rows["Опис"]).toBe("—");
  });

  it('лист "Відповіді" має заголовок з датою + текстами питань у правильному порядку', async () => {
    const file = await exportToExcel(buildExportData());
    const workbook = await readWorkbook(file.buffer);
    const sheet = workbook.getWorksheet("Відповіді")!;

    const headerRow = sheet.getRow(1).values as unknown[];
    expect(headerRow[1]).toBe("Дата надсилання");
    expect(headerRow[2]).toBe("Ваше ім'я?");
    expect(headerRow[7]).toBe('Які мови програмування знаєте? "Топ", варіант');
  });

  it('лист "Відповіді" має рядок на кожну відповідь з правильними значеннями', async () => {
    const file = await exportToExcel(buildExportData());
    const workbook = await readWorkbook(file.buffer);
    const sheet = workbook.getWorksheet("Відповіді")!;

    expect(sheet.rowCount).toBe(3);

    const firstDataRow = sheet.getRow(2).values as unknown[];
    expect(firstDataRow[4]).toBe("Так");
    expect(firstDataRow[7]).toBe("TypeScript; Go");
  });

  it('форма без відповідей дає лист "Відповіді" лише з заголовком', async () => {
    const file = await exportToExcel(buildExportData({ responses: [] }));
    const workbook = await readWorkbook(file.buffer);
    const sheet = workbook.getWorksheet("Відповіді")!;

    expect(sheet.rowCount).toBe(1);
  });

  it("генерує правильні fileName та mimeType", async () => {
    const file = await exportToExcel(buildExportData());

    expect(file.fileName).toBe("opytuvannia-senior-2026-responses.xlsx");
    expect(file.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});
