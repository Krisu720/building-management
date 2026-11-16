import { z } from 'zod/v4';

export type IssueBuilding = { id: string; name: string; address: string };
export type IssueApartment = { id: string; buildingId: string; number: string };

export const issueFormLimits = {
  title: 120,
  commonLocation: 120,
  description: 1000,
  photos: 5,
  photosTotalBytes: 10 * 1024 * 1024,
} as const;

export const issuePhotoMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const issuePhotoSchema = z
  .file()
  .min(1, 'Jeden z plików jest pusty. Wybierz inne zdjęcie.')
  .refine(
    (file) =>
      issuePhotoMimeTypes.some((type) => type === file.type) ||
      (file.type === '' && /\.(jpe?g|png|webp)$/i.test(file.name)),
    'Wybierz zdjęcia w formacie JPG, PNG, WEBP.',
  );

export const issuePhotosSchema = z.array(z.file()).superRefine((files, ctx) => {
  if (files.length > issueFormLimits.photos) {
    ctx.addIssue({
      code: 'custom',
      message: 'Możesz dodać maksymalnie 5 zdjęć.',
    });
  }
  if (
    files.reduce((size, file) => size + file.size, 0) >
    issueFormLimits.photosTotalBytes
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Zdjęcia mogą zajmować łącznie maksymalnie 10 MB.',
    });
  }
  for (const file of files) {
    const result = issuePhotoSchema.safeParse(file);
    if (!result.success) {
      ctx.addIssue({
        code: 'custom',
        message: result.error.issues[0]?.message ?? 'Nieprawidłowe zdjęcie.',
      });
      break;
    }
  }
});

const requiredId = (message: string) =>
  z
    .string({ error: message })
    .min(1, message)
    .pipe(z.uuid({ error: 'Nieprawidłowy identyfikator.' }));

const commonFields = {
  title: z
    .string({ error: 'Wpisz temat usterki.' })
    .trim()
    .min(1, 'Wpisz temat usterki.')
    .max(issueFormLimits.title, 'Temat może mieć maksymalnie 120 znaków.'),
  buildingId: requiredId('Wybierz budynek.'),
  description: z
    .string({ error: 'Opisz problem.' })
    .trim()
    .min(1, 'Opisz problem.')
    .max(
      issueFormLimits.description,
      'Opis może mieć maksymalnie 1000 znaków.',
    ),
  photos: issuePhotosSchema.default([]),
};

const issueFormSchema = z.discriminatedUnion('scope', [
  z.object({
    ...commonFields,
    scope: z.literal('apartment'),
    apartmentId: requiredId('Wybierz mieszkanie.'),
    commonLocation: z.string().optional(),
  }),
  z.object({
    ...commonFields,
    scope: z.literal('common'),
    apartmentId: z.string().optional(),
    commonLocation: z
      .string({ error: 'Podaj miejsce usterki.' })
      .trim()
      .min(1, 'Podaj miejsce usterki.')
      .max(issueFormLimits.commonLocation, 'Maksymalnie 120 znaków.'),
  }),
]);

export function createIssueFormSchema(
  buildings: readonly IssueBuilding[],
  apartments: readonly IssueApartment[],
) {
  return issueFormSchema.superRefine((values, ctx) => {
    if (!buildings.some((building) => building.id === values.buildingId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['buildingId'],
        message: 'Wybierz budynek z listy.',
      });
    }
    if (
      values.scope === 'apartment' &&
      !apartments.some(
        (apartment) =>
          apartment.id === values.apartmentId &&
          apartment.buildingId === values.buildingId,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['apartmentId'],
        message: 'Wybierz mieszkanie w wybranym budynku.',
      });
    }
  });
}

export type IssueFormInput = z.input<typeof issueFormSchema>;
export type IssueFormValues = z.output<typeof issueFormSchema>;
