import "dotenv/config";
import IORedis from "ioredis";
import { getRedisUrl } from "../../config/env.js";

export const redisConnection = new IORedis(getRedisUrl(), {
  maxRetriesPerRequest: null,
});
