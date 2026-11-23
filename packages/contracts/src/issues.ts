import { issues } from '@building-management/db/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const MAX_PG_INT = 2_147_483_647;

export const ISSUE_LIMITS = {
  title: 120,
  // 1200 znaków opisu
  description: 1200,
} as const;

export function formatIssueNumber(number: number): string {
  return `#${number}`;
}

export function parseIssueNumber(input: string): number | null {
  const match = /^#?(\d+)$/.exec(input.trim());
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_PG_INT ? value : null;
}

export const IssueSchema = createSelectSchema(issues, {
  number: z.number().int().min(1).max(MAX_PG_INT),
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

export const ListIssuesQuerySchema = z
  .object({
    number: z
      .string()
      .trim()
      .transform((value, ctx) => {
        const parsed = parseIssueNumber(value);
        if (parsed === null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Niepoprawny numer zgłoszenia (oczekiwano np. #1001 lub 1001)',
          });
          return z.NEVER;
        }
        return parsed;
      })
      .optional(),
  })
  .meta({ id: 'ListIssuesQuery' });

export const IssueListItemSchema = IssueSchema.extend({
  building: z.object({ id: z.uuid(), name: z.string(), address: z.string() }),
  apartment: z.object({ id: z.uuid(), number: z.string() }).nullable(),
  reporter: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
}).meta({ id: 'IssueListItem' });

export type Issue = z.infer<typeof IssueSchema>;
export type CreateIssue = z.infer<typeof CreateIssueSchema>;
export type ListIssuesQuery = z.infer<typeof ListIssuesQuerySchema>;
export type IssueListItem = z.infer<typeof IssueListItemSchema>;
