import { beforeAll, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js";

const TEST_SECRET = "test-secret-for-vitest";

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

const makeReq = (authHeader?: string) => ({ headers: { authorization: authHeader } }) as any;

const makeRes = () => ({ locals: {} }) as any;

describe("authMiddleware", () => {
  it("кидає 401, якщо заголовок Authorization відсутній", async () => {
    const { authMiddleware } = await import("./auth.js");
    const next = vi.fn();

    expect(() => authMiddleware(makeReq(undefined), makeRes(), next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it("кидає 401, якщо заголовок не має префіксу Bearer", async () => {
    const { authMiddleware } = await import("./auth.js");
    const token = jwt.sign({ userId: "user-1" }, TEST_SECRET);
    const next = vi.fn();

    expect(() => authMiddleware(makeReq(token), makeRes(), next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it("кидає 401 для невалідного/протухлого токена", async () => {
    const { authMiddleware } = await import("./auth.js");
    const next = vi.fn();

    expect(() => authMiddleware(makeReq("Bearer not-a-real-token"), makeRes(), next)).toThrow(
      AppError,
    );
  });

  it("кидає 401 для токена, підписаного іншим секретом", async () => {
    const { authMiddleware } = await import("./auth.js");
    const foreignToken = jwt.sign({ userId: "user-1" }, "different-secret");
    const next = vi.fn();

    expect(() => authMiddleware(makeReq(`Bearer ${foreignToken}`), makeRes(), next)).toThrow(
      AppError,
    );
  });

  it("для валідного токена кладе userId у res.locals і викликає next", async () => {
    const { authMiddleware } = await import("./auth.js");
    const token = jwt.sign({ userId: "user-42" }, TEST_SECRET);
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(makeReq(`Bearer ${token}`), res, next);

    expect(res.locals.userId).toBe("user-42");
    expect(next).toHaveBeenCalledOnce();
  });
});
