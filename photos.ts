import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { inspections } from './inspections.js';
import { issues } from './issues.js';

export const photos = pgTable(
  'photos',
  {
    id: uuid().primaryKey().defaultRandom(),
    issueId: uuid().references(() => issues.id, { onDelete: 'cascade' }),
    inspectionId: uuid().references(() => inspections.id, { onDelete: 'cascade' }),
    filePath: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.issueId),
    index().on(t.inspectionId),
    check('photos_single_owner', sql`num_nonnulls(${t.issueId}, ${t.inspectionId}) = 1`),
  ],
);

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
