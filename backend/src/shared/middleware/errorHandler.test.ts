import { describe, expect, it, vi } from "vitest";
import { AppError, errorHandler } from "./errorHandler.js";

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("AppError", () => {
  it("зберігає message/statusCode/errors", () => {
    const err = new AppError("Bad request", 400, { field: "email" });

    expect(err.message).toBe("Bad request");
    expect(err.statusCode).toBe(400);
    expect(err.errors).toEqual({ field: "email" });
    expect(err).toBeInstanceOf(Error);
  });

  it("errors необов'язковий", () => {
    const err = new AppError("Not found", 404);

    expect(err.errors).toBeUndefined();
  });
});

describe("errorHandler", () => {
  it("для AppError повертає його statusCode і message", () => {
    const res = makeRes();
    const err = new AppError("Forbidden", 403, { reason: "not owner" });

    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden",
      errors: { reason: "not owner" },
    });
  });

  it("для AppError без errors підставляє null", () => {
    const res = makeRes();
    const err = new AppError("Not found", 404);

    errorHandler(err, {} as any, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({ message: "Not found", errors: null });
  });

  it("для будь-якої іншої помилки повертає 500 і не витікає деталей", () => {
    const res = makeRes();

    errorHandler(new Error("щось секретне про БД"), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });

  it('обробляє навіть не-Error значення (throw "рядок")', () => {
    const res = makeRes();

    errorHandler("щось незрозуміле", {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
