import { apartments } from '@building-management/db/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const ApartmentSchema = createSelectSchema(apartments, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Apartment' });

export const ListApartmentsQuerySchema = z
  .object({
    buildingId: z.uuid().optional(),
  })
  .meta({ id: 'ListApartmentsQuery' });

export type Apartment = z.infer<typeof ApartmentSchema>;
export type ListApartmentsQuery = z.infer<typeof ListApartmentsQuerySchema>;
