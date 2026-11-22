import { z } from 'zod';

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

export type ResidentListItem = z.infer<typeof ResidentListItemSchema>;
