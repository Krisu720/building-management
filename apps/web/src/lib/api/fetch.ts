import { z } from 'zod/v4';

const errorBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
});

export class ApiError<T = unknown> extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data: T,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ErrorType<T> = ApiError<T>;

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Nie udało się połączyć z serwerem. Spróbuj ponownie.',
) {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return 'Sesja wygasła. Zaloguj się ponownie.';
  if (error.status === 403) return 'Nie masz uprawnień do tej operacji.';
  if (error.status >= 500)
    return 'Serwer jest chwilowo niedostępny. Spróbuj ponownie.';
  return error.message;
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers,
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(
      response.ok ? 502 : response.status,
      'Serwer zwrócił nieprawidłową odpowiedź.',
      undefined,
    );
  }
  if (!response.ok) {
    const result = errorBodySchema.safeParse(body);
    const message = result.success ? result.data.message : undefined;
    throw new ApiError(
      response.status,
      Array.isArray(message)
        ? message.join(' ')
        : message || 'Nie udało się wykonać operacji.',
      body,
    );
  }
  return body as T;
}
