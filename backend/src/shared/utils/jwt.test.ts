import { beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret-for-vitest";

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

describe("generateToken", () => {
  it("генерує токен, який верифікується тим самим секретом і містить payload", async () => {
    const { generateToken } = await import("./jwt.js");

    const token = generateToken({ userId: "user-1" });
    const decoded = jwt.verify(token, TEST_SECRET) as { userId: string };

    expect(decoded.userId).toBe("user-1");
  });

  it("токен спливає через 15 хвилин (900с)", async () => {
    const { generateToken } = await import("./jwt.js");

    const token = generateToken({ userId: "user-1" });
    const decoded = jwt.decode(token) as { iat: number; exp: number };

    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it("токен, підписаний іншим секретом, не верифікується", async () => {
    const { generateToken } = await import("./jwt.js");

    const token = generateToken({ userId: "user-1" });

    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });
});
