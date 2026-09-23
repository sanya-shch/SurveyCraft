import cookieParser from "cookie-parser";
import express, { Router } from "express";
import jwt from "jsonwebtoken";
import { errorHandler } from "../shared/middleware/errorHandler.js";

export const TEST_JWT_SECRET = "test-secret-for-vitest";

export const buildTestApp = (router: Router, basePath: string) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(basePath, router);
  app.use(errorHandler);
  return app;
};

export const makeAuthHeader = (userId: string) => {
  const token = jwt.sign({ userId }, TEST_JWT_SECRET);
  return `Bearer ${token}`;
};
