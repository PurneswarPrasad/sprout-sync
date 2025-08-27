import { z } from 'zod';

// Create User DTO
export const createUserSchema = z.object({
  googleId: z.string().min(1, 'Google ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

// User Response DTO
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.date(),
});

export type UserResponseDTO = z.infer<typeof userResponseSchema>;

