import "dotenv/config";
import { createExportWorker } from "./modules/export/export.worker.js";

const exportWorker = createExportWorker();

exportWorker.on("completed", (job) => {
  console.log(`[export-worker] job ${job.id} completed`);
});

exportWorker.on("failed", (job, err) => {
  console.error(`[export-worker] job ${job?.id} failed:`, err.message);
});

console.log('Export worker запущено, очікую завдання з черги "export"...');

const shutdown = async () => {
  console.log("Завершення роботи export worker...");
  await exportWorker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
