import { z } from 'zod';
import { Question } from '../../shared/types/questions.js';

export const buildResponseSchema = (questions: unknown) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const q of questions as Question[]) {
    let schema;

    switch (q.type) {
      case 'TEXT': {
        schema = z.string().min(1, 'This field is required');

        if (q.config?.variant === 'email') {
          schema = schema.email('Invalid email');
        }

        if (q.config?.minLength) {
          schema = schema.min(q.config.minLength);
        }

        if (q.config?.maxLength) {
          schema = schema.max(q.config.maxLength);
        }

        if (q.config?.pattern) {
          schema = schema.regex(new RegExp(q.config.pattern), 'Invalid format');
        }

        break;
      }

      case 'NUMBER': {
        schema = z.number();

        if (q.config?.min !== undefined) {
          schema = schema.min(q.config.min);
        }

        if (q.config?.max !== undefined) {
          schema = schema.max(q.config.max);
        }

        break;
      }

      case 'BOOLEAN': {
        schema = z.boolean();

        if (q.required) {
          schema = schema.refine(
            (val) => val === true,
            'This field must be accepted'
          );
        }

        break;
      }

      case 'DATE': {
        schema = z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), 'Invalid date');
        break;
      }

      case 'CHOICE_SINGLE': {
        const optionIds = (q.options as { id: string }[]).map((o) => o.id);

        schema = z.enum(optionIds as [string, ...string[]]);

        break;
      }

      case 'CHOICE_MULTI': {
        const optionIds = (q.options as { id: string }[]).map((o) => o.id);

        schema = z.array(z.enum(optionIds as [string, ...string[]]));

        if (q.required) {
          schema = schema.min(1);
        }

        break;
      }

      default:
        throw new Error(`Unsupported question type: ${q.type}`);
    }

    if (!q.required && q.type !== 'BOOLEAN') {
      schema = schema.optional();
    }

    shape[q.id] = schema;
  }

  return z.object(shape);
};
