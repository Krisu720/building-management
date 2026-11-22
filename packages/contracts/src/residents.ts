import { z } from 'zod';

export const ResidentIdSchema = z.string().trim().min(1);

export const ResidentListItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    buildingName: z.string().nullable(),
    buildingAddress: z.string().nullable(),
    apartmentNumber: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'ResidentListItem' });

export const AssignResidentApartmentSchema = z
  .object({
    apartmentId: z.uuid().nullable(),
  })
  .meta({ id: 'AssignResidentApartment' });

export type ResidentListItem = z.infer<typeof ResidentListItemSchema>;
export type AssignResidentApartment = z.infer<typeof AssignResidentApartmentSchema>;
