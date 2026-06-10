import { z } from 'zod';
import { createFormSchema, updateFormSchema } from './form.schema.js';
import { Question } from '@prisma/client';

export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;

export type FormDto = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  shareId: string;
  userId: string;
};

export type PublicFormDto = {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
};

export type UserFormsDto = (FormDto & {
  _count: { questions: number; responses: number };
})[];

export type UserFormDto = FormDto & {
  questions: Question[];
  _count: {
    responses: number;
  };
};
