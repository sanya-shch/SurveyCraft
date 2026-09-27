import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiGet, ApiError } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return { ...actual, apiGet: vi.fn() };
});

import { useResponseDetail, getResponseDetailErrorMessage } from "./useResponseDetail";

const mockedApiGet = vi.mocked(apiGet);

describe("getResponseDetailErrorMessage (чиста функція, без async/mock)", () => {
  it("ApiError -> повідомлення про деталі відповіді", () => {
    expect(getResponseDetailErrorMessage(new ApiError(404, "x"))).toBe(
      "analytics.errors.responseDetailLoadFailed",
    );
  });
  it("не-ApiError -> 'Помилка мережі'", () => {
    expect(getResponseDetailErrorMessage(new TypeError("x"))).toBe("analytics.errors.networkError");
  });
});

describe("useResponseDetail (composable)", () => {
  beforeEach(() => mockedApiGet.mockReset());

  it("НЕ фетчить одразу - isLoading=false до виклику load()", () => {
    const { isLoading, data } = useResponseDetail("http://api.test", "form-1");
    expect(isLoading.value).toBe(false);
    expect(data.value).toBeNull();
    expect(mockedApiGet).not.toHaveBeenCalled();
  });

  it("load(responseId) фетчить правильний endpoint", async () => {
    mockedApiGet.mockResolvedValue({
      id: "resp-1",
      formId: "form-1",
      createdAt: "2026-01-01",
      answers: [],
    });

    const { data, load } = useResponseDetail("http://api.test", "form-1");
    await load("resp-1");

    expect(data.value?.id).toBe("resp-1");
    expect(mockedApiGet).toHaveBeenCalledWith("http://api.test", "/forms/form-1/responses/resp-1");
  });
});
