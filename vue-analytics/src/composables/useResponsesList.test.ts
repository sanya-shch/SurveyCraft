import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { apiGet, ApiError } from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return { ...actual, apiGet: vi.fn() };
});

import { useResponsesList, getResponsesListErrorMessage } from "./useResponsesList";

const mockedApiGet = vi.mocked(apiGet);

describe("getResponsesListErrorMessage (чиста функція, без async/mock)", () => {
  it("ApiError -> повідомлення про відповіді", () => {
    expect(getResponsesListErrorMessage(new ApiError(500, "x"))).toBe(
      "Не вдалося завантажити відповіді",
    );
  });
  it("не-ApiError -> 'Помилка мережі'", () => {
    expect(getResponsesListErrorMessage(new TypeError("x"))).toBe("Помилка мережі");
  });
});

describe("useResponsesList (composable)", () => {
  beforeEach(() => mockedApiGet.mockReset());

  it("завантажує сторінку 1 з limit=10 одразу при виклику", async () => {
    mockedApiGet.mockResolvedValue({ total: 3, page: 1, limit: 10, data: [] });

    const { data, isLoading } = useResponsesList("http://api.test", "form-1");
    expect(isLoading.value).toBe(true);

    await flushPromises();

    expect(isLoading.value).toBe(false);
    expect(data.value?.total).toBe(3);
    expect(mockedApiGet).toHaveBeenCalledWith(
      "http://api.test",
      "/forms/form-1/responses?page=1&limit=10",
    );
  });

  it("зміна page перезавантажує список з новою сторінкою", async () => {
    mockedApiGet.mockResolvedValue({ total: 25, page: 1, limit: 10, data: [] });

    const { page } = useResponsesList("http://api.test", "form-1");
    await flushPromises();
    expect(mockedApiGet).toHaveBeenCalledTimes(1);

    page.value = 2;
    await flushPromises();

    expect(mockedApiGet).toHaveBeenCalledTimes(2);
    expect(mockedApiGet).toHaveBeenLastCalledWith(
      "http://api.test",
      "/forms/form-1/responses?page=2&limit=10",
    );
  });
});
