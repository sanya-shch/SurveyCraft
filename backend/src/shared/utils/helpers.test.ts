import { describe, expect, it } from "vitest";
import { toJson } from "./helpers.js";

describe("toJson", () => {
  it("пропускає значення без змін (це type-cast, не runtime-трансформація)", () => {
    expect(toJson({ a: 1 })).toEqual({ a: 1 });
    expect(toJson([1, 2, 3])).toEqual([1, 2, 3]);
    expect(toJson("text")).toBe("text");
    expect(toJson(null)).toBe(null);
  });
});
