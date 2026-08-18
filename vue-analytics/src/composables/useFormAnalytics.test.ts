import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { apiGet, ApiError } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return { ...actual, apiGet: vi.fn() };
});

const mockedApiGet = vi.mocked(apiGet);

describe("getAnalyticsErrorMessage (чиста функція, без async/mock)", () => {
  it("403 -> дружнє повідомлення про відсутність доступу", async () => {
    const { getAnalyticsErrorMessage } = await import("./useFormAnalytics");
    expect(getAnalyticsErrorMessage(new ApiError(403, "forbidden"))).toBe(
      "Немає доступу до аналітики цієї форми",
    );
  });

  it("404 -> 'Форму не знайдено'", async () => {
    const { getAnalyticsErrorMessage } = await import("./useFormAnalytics");
    expect(getAnalyticsErrorMessage(new ApiError(404, "not found"))).toBe("Форму не знайдено");
  });

  it("інший статус ApiError -> загальне повідомлення", async () => {
    const { getAnalyticsErrorMessage } = await import("./useFormAnalytics");
    expect(getAnalyticsErrorMessage(new ApiError(500, "server error"))).toBe(
      "Не вдалося завантажити аналітику",
    );
  });

  it("не-ApiError виняток -> те саме загальне повідомлення", async () => {
    const { getAnalyticsErrorMessage } = await import("./useFormAnalytics");
    expect(getAnalyticsErrorMessage(new TypeError("network down"))).toBe(
      "Не вдалося завантажити аналітику",
    );
    expect(getAnalyticsErrorMessage("не Error взагалі")).toBe("Не вдалося завантажити аналітику");
  });
});

describe("useFormAnalytics (composable - loading/success шлях)", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it("одразу виставляє isLoading=true, поки запит не завершився", async () => {
    mockedApiGet.mockReturnValue(new Promise(() => {})); // ніколи не резолвиться
    const { useFormAnalytics } = await import("./useFormAnalytics");

    const { isLoading, data, error } = useFormAnalytics("http://api.test", "form-1");

    expect(isLoading.value).toBe(true);
    expect(data.value).toBeNull();
    expect(error.value).toBeNull();
  });

  it("після успішного запиту заповнює data і скидає isLoading", async () => {
    mockedApiGet.mockResolvedValue({ totalResponses: 3, questions: [] });
    const { useFormAnalytics } = await import("./useFormAnalytics");

    const { data, isLoading } = useFormAnalytics("http://api.test", "form-1");
    await flushPromises();

    expect(isLoading.value).toBe(false);
    expect(data.value).toEqual({ totalResponses: 3, questions: [] });
    expect(mockedApiGet).toHaveBeenCalledWith("http://api.test", "/forms/form-1/analytics");
  });

  it("reload() повторно викликає apiGet", async () => {
    mockedApiGet.mockResolvedValue({ totalResponses: 1, questions: [] });
    const { useFormAnalytics } = await import("./useFormAnalytics");

    const { reload } = useFormAnalytics("http://api.test", "form-1");
    await flushPromises();
    expect(mockedApiGet).toHaveBeenCalledTimes(1);

    await reload();
    expect(mockedApiGet).toHaveBeenCalledTimes(2);
  });
});
