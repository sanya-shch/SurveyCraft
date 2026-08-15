import { z } from 'zod';

export const createFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});

const conditionRuleSchema = z.object({
  questionId: z.string(),
  operator: z.enum(['equals', 'notEquals', 'contains', 'in', 'gt', 'lt']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const conditionSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(conditionRuleSchema).min(1),
});

const base = {
  id: z.string().optional(),
  text: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  order: z.number(),
  condition: conditionSchema.optional().nullable(),
};

const configSchema = z.object({
  variant: z.enum(['input', 'textarea', 'email', 'name']).optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
});

const optionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const questionSchema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('TEXT'),
    config: configSchema.optional(),
  }),

  z.object({
    ...base,
    type: z.literal('CHOICE_SINGLE'),
    options: z.array(optionSchema).min(1),
    config: z
      .object({
        displayVariant: z.enum(['list', 'tabs', 'dropdown']).optional(),
      })
      .optional(),
  }),

  z.object({
    ...base,
    type: z.literal('CHOICE_MULTI'),
    options: z.array(optionSchema).min(1),
    config: z
      .object({
        displayVariant: z.enum(['list', 'tabs', 'dropdown']).optional(),
      })
      .optional(),
  }),

  z.object({
    ...base,
    type: z.literal('BOOLEAN'),
    config: z
      .object({
        defaultValue: z.boolean().optional(),
      })
      .optional(),
  }),

  z.object({
    ...base,
    type: z.literal('DATE'),
  }),

  z.object({
    ...base,
    type: z.literal('NUMBER'),
    config: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
  }),
]);

export const updateFormSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(questionSchema),
});
