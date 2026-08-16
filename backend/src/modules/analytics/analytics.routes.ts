import { Router } from "express";
import {
  getAnalyticsHandler,
  getFormPathsHandler,
  getQuestionAnalyticsHandler,
  getResponseByIdHandler,
  getResponsesHandler,
} from "./analytics.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.js";

const router = Router();

router.get("/:formId/analytics", authMiddleware, getAnalyticsHandler);
router.get("/:formId/analytics/paths", authMiddleware, getFormPathsHandler);
router.get("/:formId/questions/:questionId/analytics", authMiddleware, getQuestionAnalyticsHandler);
router.get("/:formId/responses", authMiddleware, getResponsesHandler);
router.get("/:formId/responses/:responseId", authMiddleware, getResponseByIdHandler);

export default router;
