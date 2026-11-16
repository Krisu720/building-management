'use client';

import Link from 'next/link';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import {
  createAuthFormSchema,
  type AuthFormInput,
  type AuthFormValues,
} from '@/lib/form-schemas';

const inputClassName =
  "h-[52px]! p-[0_16px_0_44px]! text-[15px]! rounded-[6px]! border-[#e2e8f0]! bg-white! shadow-[0_1px_2px_#132e4c03]! [transition:border-color_140ms_ease,_box-shadow_140ms_ease]! placeholder:text-[#9aa5b4]! focus-visible:border-[#6ea8ff]! focus-visible:shadow-[0_0_0_3px_#0866f512]! focus-visible:outline-none! max-[760px]:text-[16px]! max-[760px]:h-[48px]! aria-invalid:border-[#d56a61]! [&[aria-invalid='true']:focus-visible]:shadow-[0_0_0_3px_#d56a611a]!";

function errorMessage(code?: string) {
  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_PASSWORD':
    case 'USER_NOT_FOUND':
      return 'Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'Nie udało się utworzyć konta. Jeśli masz już konto, przejdź do logowania.';
    case 'PASSWORD_TOO_SHORT':
      return 'Hasło musi mieć co najmniej 8 znaków.';
    case 'PASSWORD_TOO_LONG':
      return 'Hasło może mieć maksymalnie 128 znaków.';
    case 'TOO_MANY_REQUESTS':
      return 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.';
    default:
      return 'Nie udało się wykonać operacji. Spróbuj ponownie za chwilę.';
  }
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const router = useRouter();
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: pending },
  } = useForm<AuthFormInput, unknown, AuthFormValues>({
    resolver: standardSchemaResolver(createAuthFormSchema(mode)),
    defaultValues: { name: '', email: '', password: '', remember: true },
    shouldUnregister: true,
  });

  function showServerError(message: string) {
    setError('root.server', { type: 'server', message });
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function onSubmit(values: AuthFormValues) {
    try {
      const result = registering
        ? await authClient.signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
          })
        : await authClient.signIn.email({
            email: values.email,
            password: values.password,
            rememberMe: values.remember,
          });
      if (result.error) {
        showServerError(
          result.error.status >= 500
            ? 'Serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę.'
            : errorMessage(result.error.code),
        );
      } else {
        router.replace('/');
        router.refresh();
      }
    } catch {
      showServerError(
        'Nie można połączyć się z serwerem. Sprawdź połączenie i spróbuj ponownie.',
      );
    }
  }

  return (
    <>
      <div>
        <span className="inline-block text-[14px] font-[500] text-[#0866f5]">
          Panel zarządzania nieruchomościami
        </span>
        <h1 className="m-[15px_0_9px] text-[38px] font-[600] tracking-[-0.9px] leading-[1.25] max-[760px]:text-[30px]">
          {registering ? 'Utwórz konto' : 'Zaloguj się'}
        </h1>
        <p className="m-0 text-[#788396] text-[15px] leading-[1.7]">
          {registering
            ? 'Podaj swoje dane, aby założyć konto.'
            : 'Wpisz swój e-mail i hasło.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-[22px] mt-[32px]"
        aria-busy={pending}
      >
        {registering && (
          <div className="flex flex-col gap-[8px]">
            <Label
              className="text-[15px]! font-[500]! text-[#364152]!"
              htmlFor={id + '-name'}
            >
              Imię i nazwisko
            </Label>
            <div className="relative">
              <UserRound
                className="absolute left-[16px] top-[50%] [transform:translateY(-50%)] text-[#9aa6b6] pointer-events-none"
                size={17}
                aria-hidden="true"
              />
              <Input
                className={inputClassName}
                id={id + '-name'}
                placeholder="Jan Kowalski"
                autoComplete="name"
                readOnly={pending}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? id + '-name-error' : undefined}
                {...register('name')}
              />
            </div>
            <FieldError
              id={id + '-name-error'}
              message={errors.name?.message}
            />
          </div>
        )}
        <div className="flex flex-col gap-[8px]">
          <Label
            className="text-[15px]! font-[500]! text-[#364152]!"
            htmlFor={id + '-email'}
          >
            Adres e-mail
          </Label>
          <div className="relative">
            <Mail
              className="absolute left-[16px] top-[50%] [transform:translateY(-50%)] text-[#9aa6b6] pointer-events-none"
              size={17}
              aria-hidden="true"
            />
            <Input
              className={inputClassName}
              id={id + '-email'}
              type="email"
              placeholder="jan@przyklad.pl"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              readOnly={pending}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? id + '-email-error' : undefined}
              {...register('email')}
            />
          </div>
          <FieldError
            id={id + '-email-error'}
            message={errors.email?.message}
          />
        </div>
        <div className="flex flex-col gap-[8px]">
          <Label
            className="text-[15px]! font-[500]! text-[#364152]!"
            htmlFor={id + '-password'}
          >
            Hasło
          </Label>
          <div className="relative">
            <LockKeyhole
              className="absolute left-[16px] top-[50%] [transform:translateY(-50%)] text-[#9aa6b6] pointer-events-none"
              size={17}
              aria-hidden="true"
            />
            <Input
              className={inputClassName + ' pr-[46px]!'}
              id={id + '-password'}
              type={showPassword ? 'text' : 'password'}
              placeholder={
                registering ? 'Utwórz bezpieczne hasło' : 'Wpisz swoje hasło'
              }
              autoComplete={registering ? 'new-password' : 'current-password'}
              readOnly={pending}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={
                [
                  registering ? id + '-hint' : '',
                  errors.password ? id + '-password-error' : '',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              {...register('password')}
            />
            <button
              type="button"
              className="absolute top-[6px] right-[6px] grid place-items-center w-[40px] h-[40px] rounded-[4px] text-[#91a0b1] cursor-pointer disabled:cursor-default disabled:opacity-[0.5] focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[4px] focus-visible:rounded-[3px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:text-[#0866f5] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:bg-[#f2f7ff] max-[760px]:top-[4px]"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              aria-pressed={showPassword}
              disabled={pending}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {registering && (
            <p
              className="m-0 text-[12px] leading-[1.6] text-[#788396]"
              id={id + '-hint'}
            >
              Od 8 do 128 znaków.
            </p>
          )}
          <FieldError
            id={id + '-password-error'}
            message={errors.password?.message}
          />
        </div>

        {!registering && (
          <label className="flex items-center w-[fit-content] gap-[8px] cursor-pointer text-[14px] text-[#69778a]">
            <input
              className="w-[16px] h-[16px] m-0 accent-[#0866f5] cursor-pointer"
              type="checkbox"
              disabled={pending}
              {...register('remember')}
            />
            <span>Zapamiętaj mnie</span>
          </label>
        )}

        {errors.root?.server?.message && (
          <div
            className="[border:1px_solid_#f0d2ce] rounded-[6px] p-[10px_12px] text-[#a03830] bg-[#fff6f4] text-[12px] leading-[1.6] focus:[outline:2px_solid_#b46b60] focus:outline-offset-[2px]"
            role="alert"
            tabIndex={-1}
            ref={errorRef}
          >
            {errors.root.server.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="w-full! h-[52px]! flex! justify-center! gap-[8px]! bg-[#0866f5]! text-white! text-[15px]! font-[500]! rounded-[6px]! shadow-[0_2px_3px_#0866f51a,_inset_0_1px_0_#ffffff15]! [transition:transform_140ms_cubic-bezier(0.23,_1,_0.32,_1),_background-color_140ms_ease]! [&:active:not(:disabled)]:[transform:scale(0.98)]! [&:active:not(:disabled)]:translate-none! disabled:opacity-[0.65]! disabled:cursor-wait! focus-visible:[outline:2px_solid_#6ea8ff]! focus-visible:outline-offset-[3px]! [&:focus-visible:active]:transform-none! [&:focus-visible:active]:[transition:none]! [@media(hover:hover)_and_(pointer:fine)]:[&:hover:not(:disabled)]:bg-[#0057dc]! motion-reduce:[transition:background-color_140ms_ease]! motion-reduce:[&:active:not(:disabled)]:transform-none!"
        >
          {pending ? (
            <>
              <LoaderCircle
                size={17}
                className="animate-[spin_700ms_linear_infinite] motion-reduce:animate-none"
                aria-hidden="true"
              />
              {registering ? 'Tworzenie konta…' : 'Logowanie…'}
            </>
          ) : (
            <>
              {registering ? 'Utwórz konto' : 'Zaloguj się'}
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <div className="flex justify-center items-center flex-wrap gap-[5px] mt-[23px] pb-0 text-[14px] text-[#788396]">
        {registering ? 'Masz już konto?' : 'Nie masz jeszcze konta?'}{' '}
        <Link
          className="focus-visible:[outline:2px_solid_#6ea8ff] focus-visible:outline-offset-[4px] focus-visible:rounded-[3px] inline-flex items-center gap-[4px] font-[500] text-[#0866f5] underline-offset-[4px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:underline"
          href={registering ? '/login' : '/register'}
        >
          {registering ? 'Zaloguj się' : 'Utwórz konto'}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
