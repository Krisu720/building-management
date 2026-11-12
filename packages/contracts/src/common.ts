import { z } from 'zod';

/** Kształt błędu zwracanego przez Nest (HttpException / walidacja). */
export const ErrorResponseSchema = z
  .object({
    statusCode: z.number().int(),
    message: z.union([z.string(), z.array(z.string())]),
    error: z.string().optional(),
  })
  .meta({ id: 'ErrorResponse' });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
