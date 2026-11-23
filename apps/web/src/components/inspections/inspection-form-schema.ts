import type {
  Apartment,
  Building,
  InspectionListItem,
  InspectionType,
} from '@/lib/api/models';
import { z } from 'zod/v4';

export const inspectionTypeLabels = {
  gas: 'Instalacja gazowa',
  electrical: 'Instalacja elektryczna',
  chimney: 'Przegląd kominiarski',
  building_annual: 'Roczny przegląd budynku',
  building_five_year: 'Pięcioletni przegląd budynku',
  other: 'Inny przegląd',
} as const satisfies Record<InspectionType, string>;

export const inspectionTypePresets = [
  { type: 'gas', label: inspectionTypeLabels.gas },
  { type: 'electrical', label: inspectionTypeLabels.electrical },
  { type: 'chimney', label: inspectionTypeLabels.chimney },
  { type: 'building_annual', label: inspectionTypeLabels.building_annual },
  { type: 'building_five_year', label: inspectionTypeLabels.building_five_year },
] as const satisfies readonly {
  type: Exclude<InspectionType, 'other'>;
  label: string;
}[];

export const inspectionTypeSuggestions: readonly string[] =
  inspectionTypePresets.map((preset) => preset.label);

export function resolveInspectionTypePayload(inputLabel: string): {
  type: InspectionType;
  typeLabel: string | null;
} {
  const trimmed = inputLabel.trim();
  const matched = inspectionTypePresets.find(
    (preset) => preset.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (matched) {
    return { type: matched.type, typeLabel: null };
  }
  return { type: 'other', typeLabel: trimmed };
}

export function getInspectionTypeLabel(
  inspection: Pick<InspectionListItem, 'type' | 'typeLabel'>,
): string {
  if (inspection.type === 'other') {
    return inspection.typeLabel?.trim() || inspectionTypeLabels.other;
  }
  return inspectionTypeLabels[inspection.type];
}

export const inspectionTypeLabelLimit = 120;

export type InspectionUser = {
  id: string;
  name: string;
  role?: string | null;
};

export function getInspectionTechnicians(users: readonly InspectionUser[]) {
  return users.filter(({ role }) =>
    (role ?? '').split(',').some((value) => value.trim() === 'technician'),
  );
}

export type InspectionBuilding = Pick<Building, 'id' | 'name' | 'address'> & {
  apartments: readonly Pick<Apartment, 'id' | 'number'>[];
};

const inspectionFormSchema = z.object({
  scope: z.enum(['building', 'apartment']),
  typeLabel: z
    .string()
    .trim()
    .min(1, 'Wpisz rodzaj przeglądu.')
    .max(
      inspectionTypeLabelLimit,
      'Rodzaj przeglądu może mieć maksymalnie 120 znaków.',
    ),
  technicianId: z.string(),
  buildingId: z.string().min(1, 'Wybierz budynek.'),
  apartmentIds: z.array(z.string()),
  scheduledDate: z.iso.date({ error: 'Wybierz datę przeglądu.' }),
  scheduledTime: z.iso.time({
    precision: -1,
    error: 'Wybierz godzinę przeglądu.',
  }),
});

export function createInspectionFormSchema(
  buildings: readonly InspectionBuilding[],
  technicians: readonly InspectionUser[],
) {
  return inspectionFormSchema
    .superRefine((values, ctx) => {
      const scheduledAt = Date.parse(
        values.scheduledDate + 'T' + values.scheduledTime,
      );
      if (Number.isFinite(scheduledAt) && scheduledAt <= Date.now()) {
        ctx.addIssue({
          code: 'custom',
          path: ['scheduledTime'],
          message: 'Wybierz termin w przyszłości.',
        });
      }

      const building = buildings.find(({ id }) => id === values.buildingId);
      if (values.buildingId && !building) {
        ctx.addIssue({
          code: 'custom',
          path: ['buildingId'],
          message: 'Wybierz budynek z listy.',
        });
      }
      if (
        values.technicianId &&
        !technicians.some(({ id }) => id === values.technicianId)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['technicianId'],
          message: 'Wybierz technika z listy.',
        });
      }
      if (values.scope === 'apartment') {
        const allowed = new Set(building?.apartments.map(({ id }) => id));
        if (
          !values.apartmentIds.length ||
          values.apartmentIds.some((id) => !allowed.has(id))
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['apartmentIds'],
            message: 'Wybierz co najmniej jedno mieszkanie w tym budynku.',
          });
        } else if (
          new Set(values.apartmentIds).size !== values.apartmentIds.length
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['apartmentIds'],
            message: 'Każde mieszkanie możesz wybrać tylko raz.',
          });
        }
      }
    })
    .transform(({ scheduledDate, scheduledTime, typeLabel, ...values }) => ({
      ...values,
      ...resolveInspectionTypePayload(typeLabel),
      scheduledAt: new Date(scheduledDate + 'T' + scheduledTime).toISOString(),
    }));
}

export type InspectionFormInput = z.input<typeof inspectionFormSchema>;
export type InspectionFormValues = z.output<
  ReturnType<typeof createInspectionFormSchema>
>;
