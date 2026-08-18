import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, ApiError } from "./client";

describe("apiGet", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("додає Authorization header, якщо токен є в localStorage", async () => {
    localStorage.setItem("token", "abc123");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiGet("http://api.test", "/forms/1/analytics");

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/forms/1/analytics", {
      headers: { Authorization: "Bearer abc123" },
    });
  });

  it("не додає Authorization header, якщо токена немає", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiGet("http://api.test", "/forms/1/analytics");

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/forms/1/analytics", { headers: {} });
  });

  it("повертає розпарсений JSON при успіху", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalResponses: 5 }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiGet<{ totalResponses: number }>("http://api.test", "/x");
    expect(result).toEqual({ totalResponses: 5 });
  });

  it("кидає ApiError зі статусом при неуспішній відповіді", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiGet("http://api.test", "/x")).rejects.toBeInstanceOf(ApiError);
    await expect(apiGet("http://api.test", "/x")).rejects.toMatchObject({ status: 403 });
  });

  it("при 401 прибирає токен з localStorage (React-хост відповідає за релогін)", async () => {
    localStorage.setItem("token", "expired-token");
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiGet("http://api.test", "/x")).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("при 403/404 НЕ чіпає токен (він не протух, просто немає доступу)", async () => {
    localStorage.setItem("token", "valid-token");
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiGet("http://api.test", "/x")).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem("token")).toBe("valid-token");
  });
});
