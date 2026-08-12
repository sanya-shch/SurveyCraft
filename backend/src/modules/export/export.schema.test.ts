import { describe, expect, it } from "vitest";
import { createExportSchema } from "./export.schema.js";

describe("createExportSchema", () => {
  it.each(["CSV", "EXCEL", "PDF"] as const)("приймає валідний формат %s", (format) => {
    const result = createExportSchema.safeParse({ format });

    expect(result.success).toBe(true);
  });

  it("відхиляє невідомий формат", () => {
    const result = createExportSchema.safeParse({ format: "DOCX" });

    expect(result.success).toBe(false);
  });

  it("відхиляє відсутній format", () => {
    const result = createExportSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("відхиляє формат у нижньому регістрі (не робить приховану нормалізацію)", () => {
    const result = createExportSchema.safeParse({ format: "csv" });

    expect(result.success).toBe(false);
  });
});
