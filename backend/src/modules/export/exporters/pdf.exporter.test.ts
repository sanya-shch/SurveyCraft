import { describe, expect, it } from "vitest";
import { exportToPdf } from "./pdf.exporter.js";
import { buildExportData } from "./testFixtures.js";

describe("exportToPdf", () => {
  it("генерує валідний непорожній PDF-буфер", async () => {
    const file = await exportToPdf(buildExportData());

    expect(file.buffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
    expect(file.buffer.subarray(-6).toString("utf-8").trim()).toMatch(/%%EOF$/);
    expect(file.buffer.length).toBeGreaterThan(500);
  });

  it("генерує правильні fileName та mimeType", async () => {
    const file = await exportToPdf(buildExportData());

    expect(file.fileName).toBe("opytuvannia-senior-2026-responses.pdf");
    expect(file.mimeType).toBe("application/pdf");
  });

  it("не падає і повертає валідний PDF для форми без жодної відповіді", async () => {
    const file = await exportToPdf(buildExportData({ responses: [] }));

    expect(file.buffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });

  it("не падає, якщо в форми немає опису", async () => {
    const file = await exportToPdf(
      buildExportData({ form: { id: "form-1", title: "Без опису", description: null } }),
    );

    expect(file.buffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });

  it("розмір файлу росте зі збільшенням кількості відповідей", async () => {
    const [small, large] = await Promise.all([
      exportToPdf(buildExportData({ responses: buildExportData().responses.slice(0, 1) })),
      exportToPdf(
        buildExportData({
          responses: [
            ...buildExportData().responses,
            ...buildExportData().responses,
            ...buildExportData().responses,
          ],
        }),
      ),
    ]);

    expect(large.buffer.length).toBeGreaterThan(small.buffer.length);
  });
});
