import { Router } from "express";
import { saveAttemptHandler } from "./attempt.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { saveAttemptSchema } from "./attempt.schema.js";

const router = Router();

router.put("/:shareId/attempt", validate(saveAttemptSchema), saveAttemptHandler);

export default router;
