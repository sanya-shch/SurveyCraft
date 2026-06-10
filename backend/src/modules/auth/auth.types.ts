import { z } from 'zod';
import { loginSchema, registerSchema } from './auth.schema.js';

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type RegisterDto = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};
export type LoginDto = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};
export type GetMeDto = {
  id: string;
  email: string;
};
