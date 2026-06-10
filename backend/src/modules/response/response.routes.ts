import { Router } from 'express';
import { submitResponseHandler } from './response.controller.js';

import { validate } from '../../shared/middleware/validate.js';
import { submitResponseSchema } from './response.schema.js';

const router = Router();

router.post(
  '/:shareId/responses',
  validate(submitResponseSchema),
  submitResponseHandler
);

export default router;
