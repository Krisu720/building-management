import { buildings } from '@building-management/db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const BuildingIdSchema = z.uuid();

/** daty są nadpisane na ISO string, bo tak serializuje je JSON. */
export const BuildingSchema = createSelectSchema(buildings, {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Building' });

export const CreateBuildingSchema = createInsertSchema(buildings, {
  name: (s) => s.trim().min(1).max(200),
  address: (s) => s.trim().min(1).max(500),
})
  .pick({ name: true, address: true })
  .meta({ id: 'CreateBuilding' });

export const UpdateBuildingSchema = CreateBuildingSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Podaj przynajmniej jedno pole do zmiany',
  })
  .meta({ id: 'UpdateBuilding' });

export const BuildingApartmentSchema = z
  .object({
    id: z.uuid(),
    number: z.string(),
  })
  .meta({ id: 'BuildingApartment' });

export const BuildingWithApartmentsSchema = BuildingSchema.extend({
  apartments: z.array(BuildingApartmentSchema),
}).meta({ id: 'BuildingWithApartments' });

export type Building = z.infer<typeof BuildingSchema>;
export type CreateBuilding = z.infer<typeof CreateBuildingSchema>;
export type UpdateBuilding = z.infer<typeof UpdateBuildingSchema>;
export type BuildingApartment = z.infer<typeof BuildingApartmentSchema>;
export type BuildingWithApartments = z.infer<typeof BuildingWithApartmentsSchema>;
