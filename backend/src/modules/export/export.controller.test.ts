import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./export.service.js", () => ({
  createExportJob: vi.fn(),
  listExportJobs: vi.fn(),
  getExportJob: vi.fn(),
  getExportFileForDownload: vi.fn(),
}));

const { createExportJob, listExportJobs, getExportJob, getExportFileForDownload } =
  await import("./export.service.js");
const { createExportHandler, listExportsHandler, getExportHandler, downloadExportHandler } =
  await import("./export.controller.js");

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.download = vi.fn();
  res.locals = { userId: "user-1" };
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createExportHandler", () => {
  it("викликає createExportJob з formId/userId/format і повертає 202 з job-ом", async () => {
    const job = { id: "job-1", status: "PENDING" };
    (createExportJob as any).mockResolvedValue(job);

    const req = { params: { formId: "form-1" }, body: { format: "CSV" } } as any;
    const res = makeRes();

    await createExportHandler(req, res);

    expect(createExportJob).toHaveBeenCalledWith("form-1", "user-1", "CSV");
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(job);
  });
});

describe("listExportsHandler", () => {
  it("повертає список job-ів форми як JSON", async () => {
    const jobs = [{ id: "job-1" }, { id: "job-2" }];
    (listExportJobs as any).mockResolvedValue(jobs);

    const req = { params: { formId: "form-1" } } as any;
    const res = makeRes();

    await listExportsHandler(req, res);

    expect(listExportJobs).toHaveBeenCalledWith("form-1", "user-1");
    expect(res.json).toHaveBeenCalledWith(jobs);
  });
});

describe("getExportHandler", () => {
  it("повертає статус конкретного job-у", async () => {
    const job = { id: "job-1", status: "COMPLETED" };
    (getExportJob as any).mockResolvedValue(job);

    const req = { params: { formId: "form-1", jobId: "job-1" } } as any;
    const res = makeRes();

    await getExportHandler(req, res);

    expect(getExportJob).toHaveBeenCalledWith("form-1", "user-1", "job-1");
    expect(res.json).toHaveBeenCalledWith(job);
  });
});

describe("downloadExportHandler", () => {
  it("стрімить файл через res.download з правильним ім'ям", async () => {
    (getExportFileForDownload as any).mockResolvedValue({
      absolutePath: "/uploads/exports/job-1-form.csv",
      fileName: "form-responses.csv",
    });

    const req = { params: { formId: "form-1", jobId: "job-1" } } as any;
    const res = makeRes();

    await downloadExportHandler(req, res);

    expect(getExportFileForDownload).toHaveBeenCalledWith("form-1", "user-1", "job-1");
    expect(res.download).toHaveBeenCalledWith(
      "/uploads/exports/job-1-form.csv",
      "form-responses.csv",
    );
  });
});
