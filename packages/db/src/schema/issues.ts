import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { apartments } from './apartments.js';
import { user } from './auth.js';
import { buildings } from './buildings.js';

export const issueStatus = pgEnum('issue_status', [
  'new',
  'in_progress',
  'resolved',
  'rejected',
]);

export const issues = pgTable(
  'issues',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text().notNull(),
    status: issueStatus().notNull().default('new'),
    buildingId: uuid()
      .notNull()
      .references(() => buildings.id, { onDelete: 'cascade' }),
    // null = część wspólna budynku.
    apartmentId: uuid().references(() => apartments.id, { onDelete: 'set null' }),
    reporterId: text().references(() => user.id, { onDelete: 'set null' }),
    technicianId: text().references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index().on(t.buildingId),
    index().on(t.apartmentId),
    index().on(t.reporterId),
    index().on(t.technicianId),
    index().on(t.status),
  ],
);

export const issueHistory = pgTable(
  'issue_history',
  {
    id: uuid().primaryKey().defaultRandom(),
    issueId: uuid()
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    status: issueStatus().notNull(),
    changedBy: text().references(() => user.id, { onDelete: 'set null' }),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.issueId)],
);

export type IssueStatus = (typeof issueStatus.enumValues)[number];
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueHistoryEntry = typeof issueHistory.$inferSelect;
export type NewIssueHistoryEntry = typeof issueHistory.$inferInsert;
