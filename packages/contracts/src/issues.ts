import { issues } from '@building-management/db/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const ISSUE_LIMITS = {
  title: 120,
  // 1200 znaków opisu
  description: 1200,
} as const;

export const IssueSchema = createSelectSchema(issues, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Issue' });

export const CreateIssueSchema = z
  .object({
    title: z.string().trim().min(1).max(ISSUE_LIMITS.title),
    description: z.string().trim().min(1).max(ISSUE_LIMITS.description),
    buildingId: z.uuid(),
    apartmentId: z.uuid().nullable().optional(),
  })
  .meta({ id: 'CreateIssue' });

export type Issue = z.infer<typeof IssueSchema>;
export type CreateIssue = z.infer<typeof CreateIssueSchema>;
