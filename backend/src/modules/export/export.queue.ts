import { Queue } from "bullmq";
import { redisConnection } from "../../shared/queue/redisConnection.js";
import { QueueNames } from "../../shared/queue/queueNames.js";
import { ExportQueueJobData } from "./export.types.js";

export const exportQueue = new Queue<ExportQueueJobData>(QueueNames.EXPORT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 24 * 3600 },
  },
});
