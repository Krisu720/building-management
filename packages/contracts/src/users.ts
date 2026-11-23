import { z } from 'zod';
import { ROLES } from './auth.js';

export const UserRoleSchema = z.enum([ROLES.ADMIN, ROLES.USER, ROLES.TECHNICIAN]);

export const UserSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
  })
  .meta({ id: 'UserSummary' });

export const ListUsersQuerySchema = z
  .object({
    role: UserRoleSchema.optional(),
  })
  .meta({ id: 'ListUsersQuery' });

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
