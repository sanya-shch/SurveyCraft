import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate } from "./validate.js";

const schema = z.object({ email: z.string().email() });

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("validate middleware", () => {
  it("пропускає валідне тіло далі й підміняє req.body на розпарсені дані", () => {
    const req: any = { body: { email: "a@b.com" } };
    const res = makeRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ email: "a@b.com" });
  });

  it("відсікає зайві поля через безпечний парсинг (zod strips за замовчуванням)", () => {
    const req: any = { body: { email: "a@b.com", extra: "hack" } };
    const res = makeRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(req.body).toEqual({ email: "a@b.com" });
  });

  it("для невалідного тіла повертає 400 з деталями помилок і НЕ викликає next", () => {
    const req: any = { body: { email: "not-an-email" } };
    const res = makeRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: expect.objectContaining({ fieldErrors: expect.anything() }),
    });
  });
});
