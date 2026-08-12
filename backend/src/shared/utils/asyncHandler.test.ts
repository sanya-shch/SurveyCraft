import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "./asyncHandler.js";

describe("asyncHandler", () => {
  it("викликає обгорнуту функцію з req/res/next", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const req = {} as any;
    const res = {} as any;
    const next = vi.fn();

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("перехоплює відхилений проміс і передає помилку в next (а не кидає)", async () => {
    const error = new Error("boom");
    const handler = vi.fn().mockRejectedValue(error);
    const next = vi.fn();

    await asyncHandler(handler)({} as any, {} as any, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
