import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { buildings } from './buildings.js';

export const apartments = pgTable(
  'apartments',
  {
    id: uuid().primaryKey().defaultRandom(),
    buildingId: uuid()
      .notNull()
      .references(() => buildings.id, { onDelete: 'cascade' }),
    number: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.buildingId, t.number)],
);

export type Apartment = typeof apartments.$inferSelect;
export type NewApartment = typeof apartments.$inferInsert;
