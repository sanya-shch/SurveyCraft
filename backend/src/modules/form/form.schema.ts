import { z } from 'zod';

export const createFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
});

const base = {
  id: z.string().optional(),
  text: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  order: z.number(),
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
