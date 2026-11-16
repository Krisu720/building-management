import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { apartments } from './apartments.js';
import { user } from './auth.js';
import { buildings } from './buildings.js';

export const inspectionType = pgEnum('inspection_type', [
  'gas',
  'electrical',
  'chimney',
  'building_annual',
  'building_five_year',
  'other',
]);

export const inspectionStatus = pgEnum('inspection_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

export const inspections = pgTable(
  'inspections',
  {
    id: uuid().primaryKey().defaultRandom(),
    type: inspectionType().notNull(),
    buildingId: uuid()
      .notNull()
      .references(() => buildings.id, { onDelete: 'cascade' }),
    // null = przegląd części wspólnej budynku.
    apartmentId: uuid().references(() => apartments.id, { onDelete: 'cascade' }),
    scheduledAt: timestamp({ withTimezone: true }).notNull(),
    status: inspectionStatus().notNull().default('scheduled'),
    technicianId: text().references(() => user.id, { onDelete: 'set null' }),
    result: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index().on(t.buildingId),
    index().on(t.apartmentId),
    index().on(t.technicianId),
    index().on(t.scheduledAt),
  ],
);

export const inspectionHistory = pgTable(
  'inspection_history',
  {
    id: uuid().primaryKey().defaultRandom(),
    inspectionId: uuid()
      .notNull()
      .references(() => inspections.id, { onDelete: 'cascade' }),
    status: inspectionStatus().notNull(),
    scheduledAt: timestamp({ withTimezone: true }).notNull(),
    changedBy: text().references(() => user.id, { onDelete: 'set null' }),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.inspectionId)],
);

export type InspectionType = (typeof inspectionType.enumValues)[number];
export type InspectionStatus = (typeof inspectionStatus.enumValues)[number];
export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;
export type InspectionHistoryEntry = typeof inspectionHistory.$inferSelect;
export type NewInspectionHistoryEntry = typeof inspectionHistory.$inferInsert;
