import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128)
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
