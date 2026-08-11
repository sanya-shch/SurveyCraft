import { Request, Response } from "express";
import { AuthLocals } from "../../shared/middleware/auth.js";
import {
  createExportJob,
  getExportFileForDownload,
  getExportJob,
  listExportJobs,
} from "./export.service.js";
import { CreateExportInput, ExportJobDto } from "./export.types.js";

export const createExportHandler = async (
  req: Request<{ formId: string }, {}, CreateExportInput>,
  res: Response<ExportJobDto>,
) => {
  const { formId } = req.params;
  const userId = (res.locals as AuthLocals).userId;

  const job = await createExportJob(formId, userId, req.body.format);

  res.status(202).json(job);
};

export const listExportsHandler = async (
  req: Request<{ formId: string }>,
  res: Response<ExportJobDto[]>,
) => {
  const { formId } = req.params;
  const userId = (res.locals as AuthLocals).userId;

  const jobs = await listExportJobs(formId, userId);

  res.json(jobs);
};

export const getExportHandler = async (
  req: Request<{ formId: string; jobId: string }>,
  res: Response<ExportJobDto>,
) => {
  const { formId, jobId } = req.params;
  const userId = (res.locals as AuthLocals).userId;

  const job = await getExportJob(formId, userId, jobId);

  res.json(job);
};

export const downloadExportHandler = async (
  req: Request<{ formId: string; jobId: string }>,
  res: Response,
) => {
  const { formId, jobId } = req.params;
  const userId = (res.locals as AuthLocals).userId;

  const { absolutePath, fileName } = await getExportFileForDownload(formId, userId, jobId);

  res.download(absolutePath, fileName);
};
