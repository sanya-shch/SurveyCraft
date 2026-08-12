import { describe, expect, it } from "vitest";
import { exportToCsv } from "./csv.exporter.js";
import { buildExportData } from "./testFixtures.js";

const parseCsv = (buffer: Buffer) => {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  return text.split("\r\n").filter((line) => line.length > 0);
};

describe("exportToCsv", () => {
  it("генерує заголовок з датою + текстами питань у правильному порядку", async () => {
    const file = await exportToCsv(buildExportData());
    const rows = parseCsv(file.buffer);

    expect(rows[0]).toBe(
      [
        "Дата надсилання",
        "Ваше ім'я?",
        "Скільки вам років?",
        "Чи згодні ви з умовами?",
        "Дата народження",
        "Улюблений колір?",
        '"Які мови програмування знаєте? ""Топ"", варіант"',
      ].join(","),
    );
  });

  it("екранує значення з комами та лапками (RFC4180)", async () => {
    const file = await exportToCsv(buildExportData());
    const rows = parseCsv(file.buffer);

    expect(rows[1]).toContain('"Олександр, ""сеньйор"""');
  });

  it("коректно форматує CHOICE_MULTI та BOOLEAN у рядку відповіді", async () => {
    const file = await exportToCsv(buildExportData());
    const rows = parseCsv(file.buffer);

    expect(rows[1]).toContain("Так");
    expect(rows[1]).toContain("TypeScript; Go");
  });

  it('порожні/відсутні відповіді дають порожню комірку, а не "null"/"undefined"', async () => {
    const file = await exportToCsv(buildExportData());
    const rows = parseCsv(file.buffer);

    expect(rows[2]).not.toMatch(/null|undefined/);
  });

  it("має рівно 1 рядок заголовка + N рядків відповідей", async () => {
    const file = await exportToCsv(buildExportData());
    const rows = parseCsv(file.buffer);

    expect(rows).toHaveLength(1 + 2);
  });

  it("файл починається з UTF-8 BOM (для коректного відкриття кирилиці в Excel)", async () => {
    const file = await exportToCsv(buildExportData());

    expect(file.buffer.toString("utf-8").charCodeAt(0)).toBe(0xfeff);
  });

  it("генерує правильні fileName та mimeType", async () => {
    const file = await exportToCsv(buildExportData());

    expect(file.fileName).toBe("opytuvannia-senior-2026-responses.csv");
    expect(file.mimeType).toBe("text/csv; charset=utf-8");
  });

  it("форма без відповідей дає лише рядок заголовка", async () => {
    const file = await exportToCsv(buildExportData({ responses: [] }));
    const rows = parseCsv(file.buffer);

    expect(rows).toHaveLength(1);
  });
});
