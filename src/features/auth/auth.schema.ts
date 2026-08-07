import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const inviteBodySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(254, 'Keep the email under 254 characters'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Keep the name under 100 characters'),
  role: z.enum(['admin', 'client', 'talent']),
});

export const acceptInviteBodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});
