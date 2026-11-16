import { z } from 'zod/v4';

const nameSchema = z
  .string({ error: 'Wpisz imię i nazwisko.' })
  .trim()
  .min(1, 'Wpisz imię i nazwisko.')
  .max(100, 'Maksymalnie 100 znaków.');
const emailSchema = z
  .string({ error: 'Wpisz adres e-mail.' })
  .trim()
  .min(1, 'Wpisz adres e-mail.')
  .pipe(z.email({ error: 'Wpisz poprawny adres e-mail.' }));

export function createAuthFormSchema(mode: 'login' | 'register') {
  const password = z
    .string({ error: 'Wpisz hasło.' })
    .min(1, 'Wpisz hasło.')
    .max(128, 'Hasło może mieć maksymalnie 128 znaków.');
  return z.object({
    name: mode === 'register' ? nameSchema : z.string().optional().default(''),
    email: emailSchema,
    password:
      mode === 'register'
        ? password.min(8, 'Hasło musi mieć co najmniej 8 znaków.')
        : password,
    remember: z.boolean().optional().default(true),
  });
}

export const profileFormSchema = z.object({ name: nameSchema });

export const passwordFormSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Wpisz obecne hasło.' })
      .min(1, 'Wpisz obecne hasło.')
      .max(128, 'Maksymalnie 128 znaków.'),
    newPassword: z
      .string({ error: 'Wpisz nowe hasło.' })
      .min(1, 'Wpisz nowe hasło.')
      .min(8, 'Co najmniej 8 znaków.')
      .max(128, 'Maksymalnie 128 znaków.'),
    confirmPassword: z
      .string({ error: 'Powtórz nowe hasło.' })
      .min(1, 'Powtórz nowe hasło.'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Nowe hasło musi różnić się od obecnego.',
      });
    }
    if (
      values.confirmPassword &&
      values.confirmPassword !== values.newPassword
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Hasła muszą być takie same.',
      });
    }
  });

export type AuthFormInput = z.input<ReturnType<typeof createAuthFormSchema>>;
export type AuthFormValues = z.output<ReturnType<typeof createAuthFormSchema>>;
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;
export type PasswordFormInput = z.input<typeof passwordFormSchema>;
export type PasswordFormValues = z.output<typeof passwordFormSchema>;
