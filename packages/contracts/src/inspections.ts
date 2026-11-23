import { inspections, inspectionType } from '@building-management/db/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const INSPECTION_LIMITS = {
  typeLabel: 120,
} as const;

export const InspectionTypeSchema = z.enum(inspectionType.enumValues).meta({ id: 'InspectionType' });

export const InspectionSchema = createSelectSchema(inspections, {
  type: InspectionTypeSchema,
  scheduledAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).meta({ id: 'Inspection' });

export const CreateInspectionSchema = z
  .object({
    scope: z.enum(['building', 'apartment']),
    type: InspectionTypeSchema,
    typeLabel: z.string().trim().min(1).max(INSPECTION_LIMITS.typeLabel).nullable().optional(),
    buildingId: z.uuid(),
    apartmentIds: z.array(z.uuid()).optional(),
    technicianId: z.string().trim().min(1).nullable().optional(),
    scheduledAt: z.iso.datetime(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'other' && !data.typeLabel) {
      ctx.addIssue({
        code: 'custom',
        path: ['typeLabel'],
        message: 'Wpisz rodzaj przeglądu.',
      });
    }
    const scheduledMs = Date.parse(data.scheduledAt);
    if (!Number.isFinite(scheduledMs) || scheduledMs <= Date.now()) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'Wybierz termin w przyszłości.',
      });
    }
    if (data.scope === 'apartment') {
      const ids = data.apartmentIds ?? [];
      if (ids.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['apartmentIds'],
          message: 'Wybierz co najmniej jedno mieszkanie w tym budynku.',
        });
      } else if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['apartmentIds'],
          message: 'Każde mieszkanie możesz wybrać tylko raz.',
        });
      }
    }
  })
  .meta({ id: 'CreateInspection' });

export const InspectionListItemSchema = InspectionSchema.extend({
  building: z.object({ id: z.uuid(), name: z.string(), address: z.string() }),
  apartment: z.object({ id: z.uuid(), number: z.string() }).nullable(),
  technician: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
}).meta({ id: 'InspectionListItem' });

export type InspectionType = z.infer<typeof InspectionTypeSchema>;
export type Inspection = z.infer<typeof InspectionSchema>;
export type CreateInspection = z.infer<typeof CreateInspectionSchema>;
export type InspectionListItem = z.infer<typeof InspectionListItemSchema>;
