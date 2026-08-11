import path from "node:path";
import fs from "node:fs/promises";
import { Job, Worker } from "bullmq";
import { redisConnection } from "../../shared/queue/redisConnection.js";
import { QueueNames } from "../../shared/queue/queueNames.js";
import { prisma } from "../../prisma/prisma.js";
import { exportersByFormat } from "./exporters/index.js";
import { EXPORTS_DIR } from "./export.service.js";
import { ExportQueueJobData } from "./export.types.js";

const processExportJob = async (job: Job<ExportQueueJobData>) => {
  const { exportJobId } = job.data;

  const exportJob = await prisma.exportJob.findUnique({
    where: { id: exportJobId },
  });

  if (!exportJob) {
    return;
  }

  await prisma.exportJob.update({
    where: { id: exportJobId },
    data: { status: "PROCESSING" },
  });

  try {
    const form = await prisma.form.findUniqueOrThrow({
      where: { id: exportJob.formId },
      include: {
        questions: { orderBy: { order: "asc" } },
        responses: { orderBy: { createdAt: "asc" } },
      },
    });

    const exporter = exportersByFormat[exportJob.format];
    const file = await exporter({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
      },
      questions: form.questions,
      responses: form.responses,
    });

    await fs.mkdir(EXPORTS_DIR, { recursive: true });

    const storedFileName = `${exportJobId}-${file.fileName}`;
    await fs.writeFile(path.join(EXPORTS_DIR, storedFileName), file.buffer);

    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: "COMPLETED",
        filePath: storedFileName,
        fileName: file.fileName,
        responseCount: form.responses.length,
        completedAt: new Date(),
        error: null,
      },
    });
  } catch (err) {
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown export error",
      },
    });

    throw err;
  }
};

export const createExportWorker = () =>
  new Worker<ExportQueueJobData>(QueueNames.EXPORT, processExportJob, {
    connection: redisConnection,
    concurrency: 3,
  });
