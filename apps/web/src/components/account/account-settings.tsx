'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useId, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { getInitials, isAdmin } from '@/lib/user-display';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import {
  profileFormSchema,
  passwordFormSchema,
  type ProfileFormInput,
  type ProfileFormValues,
  type PasswordFormInput,
  type PasswordFormValues,
} from '@/lib/form-schemas';
import { useAccount } from './account-shell';

const fieldRowClassName =
  'min-w-0 grid gap-[20px] grid-cols-[190px_minmax(0,_430px)] items-start max-[1100px]:grid-cols-[155px_minmax(0,_1fr)] max-[1100px]:max-w-[670px] max-[560px]:grid-cols-[minmax(0,_1fr)] max-[560px]:gap-[9px]';
const submitButtonClassName =
  'p-[0_16px]! bg-[#0866f5]! text-white! text-[13px]! font-[500]! [transition:background-color_140ms_ease,_transform_140ms_cubic-bezier(0.23,_1,_0.32,_1)]! [&:active:not(:disabled):not(:focus-visible)]:[transform:scale(0.98)]! [&:active:not(:disabled):not(:focus-visible)]:translate-none! disabled:opacity-[0.45]! disabled:cursor-not-allowed! min-h-[39px]! rounded-[7px]! absolute! top-[45px]! right-[48px]! px-[18px]! [@media(hover:hover)_and_(pointer:fine)]:[&:hover:not(:disabled)]:bg-[#0057dc]! max-[1100px]:top-[37px]! max-[1100px]:right-[32px]! max-[800px]:right-[20px]! max-[560px]:[position:static]! max-[560px]:m-[0_0_24px]! motion-reduce:[transition:background-color_140ms_ease]! motion-reduce:[&:active:not(:disabled):not(:focus-visible)]:transform-none!';
const fieldsetClassName =
  'flex flex-col [border:0] p-0 m-0 min-w-0 gap-[23px] disabled:opacity-[0.65] max-[560px]:gap-[22px]';
const inputClassName =
  'border-[#dfe7f0]! px-[12px]! [transition:border-color_140ms_ease,_box-shadow_140ms_ease]! bg-white! h-[40px]! rounded-[6px]! shadow-[0_1px_2px_#10274303]! text-[14px]! focus-visible:border-[#70a8fa]! focus-visible:outline-none! focus-visible:shadow-[0_0_0_3px_#0866f510]! aria-invalid:border-[#d56a61]! read-only:text-[#8a96a8]! read-only:bg-[#f5f7fb]! max-[560px]:h-[44px]! max-[560px]:text-[16px]!';
const errorNoticeClassName =
  'p-[12px_14px] mt-[20px] rounded-[6px] text-[13px] leading-[1.6] text-[#a03830] [border:1px_solid_#f0d2ce] bg-[#fff6f4] max-w-[640px]';
const savedMessageClassName =
  'inline-flex items-center gap-[6px] text-[12px] text-[#16805b] min-h-[18px] ml-[210px] max-[1100px]:ml-[175px] max-[560px]:ml-0';
const tabClassName =
  'inline-flex items-center justify-center gap-[7px] p-[13px_2px_15px] mb-[-1px] [border-bottom:2px_solid_transparent] text-[13px] text-[#7e8b9e] whitespace-nowrap aria-selected:text-[#0866f5] aria-selected:border-[#0866f5] focus-visible:[outline:2px_solid_#70a8fa] focus-visible:outline-offset-[-3px] focus-visible:rounded-[4px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:text-[#0866f5] max-[560px]:text-[12px] max-[560px]:gap-[6px]';

function PasswordField({
  label,
  autoComplete,
  registration,
  error,
}: {
  label: string;
  autoComplete: 'current-password' | 'new-password';
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={fieldRowClassName}>
      <Label
        className="text-[13px]! font-[400]! text-[#546176]! pt-[11px]! leading-[1.6]! max-[560px]:pt-0!"
        htmlFor={id}
      >
        {label}
      </Label>
      <div className="flex flex-col gap-[8px] min-w-0">
        <div className="relative">
          <Input
            className={inputClassName + ' pr-[44px]!'}
            id={id}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? id + '-error' : undefined}
            {...registration}
          />
          <button
            className="absolute [inset:3px_3px_3px_auto] w-[36px] grid place-items-center rounded-[4px] text-[#8f9db0] focus-visible:[outline:2px_solid_#70a8fa] focus-visible:outline-offset-[1px] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:bg-[#eff5ff] [@media(hover:hover)_and_(pointer:fine)]:[&:hover]:text-[#0866f5]"
            type="button"
            aria-label={(visible ? 'Ukryj: ' : 'Pokaż: ') + label.toLowerCase()}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <FieldError id={id + '-error'} message={error} />
      </div>
    </div>
  );
}

function ProfileForm() {
  const { user, refresh } = useAccount();
  const id = useId();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: standardSchemaResolver(profileFormSchema),
    defaultValues: { name: user.name },
  });

  async function save(values: ProfileFormValues) {
    setSaved(false);
    try {
      const result = await authClient.updateUser({ name: values.name });
      if (result.error) {
        setError('root.server', {
          message: 'Nie udało się zapisać danych. Spróbuj ponownie.',
        });
        return;
      }
      reset(values);
      refresh();
      setSaved(true);
    } catch {
      setError('root.server', {
        message: 'Brak połączenia z serwerem. Spróbuj ponownie.',
      });
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(save)}
      onChange={() => setSaved(false)}
      className="p-0"
      aria-busy={isSubmitting}
    >
      <Button
        className={submitButtonClassName}
        type="submit"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting && (
          <LoaderCircle
            size={15}
            className="animate-[spin_700ms_linear_infinite] motion-reduce:animate-none"
          />
        )}
        {isSubmitting ? 'Zapisywanie…' : 'Zapisz zmiany'}
      </Button>
      <header className="mb-[27px] max-[560px]:mb-[22px]">
        <h2 className="text-[15px] text-[#2e3d51] font-[550] mb-[7px]">
          Dane profilu
        </h2>
        <p className="text-[12px] text-[#8995a6] leading-[1.7]">
          Zmień swoje imię i nazwisko. Adres e-mail służy do logowania.
        </p>
      </header>
      <div className="grid grid-cols-[190px_minmax(0,_430px)] gap-[20px] items-center mb-[28px] max-[1100px]:grid-cols-[155px_minmax(0,_1fr)] max-[1100px]:max-w-[670px] max-[560px]:grid-cols-[minmax(0,_1fr)] max-[560px]:gap-[12px] max-[560px]:mb-[24px]">
        <span className="text-[13px] font-[400] text-[#546176] leading-[1.6] pt-0">
          Twój profil
        </span>
        <div className="flex items-center gap-[12px]">
          <span className="grid place-items-center w-[43px] h-[43px] [border:1px_solid_#e5e7eb] rounded-[50%] bg-transparent shadow-none text-[#546176] text-[14px] font-[550]">
            {getInitials(user.name)}
          </span>
          <div>
            <strong className="block text-[13px] font-[500] text-[#40506a] [overflow-wrap:anywhere]">
              {user.name}
            </strong>
            <small className="block text-[11px] text-[#94a0b1] mt-[4px]">
              {isAdmin(user.role) ? 'Administrator' : 'Użytkownik'}
            </small>
          </div>
        </div>
      </div>
      <fieldset disabled={isSubmitting} className={fieldsetClassName}>
        <div className={fieldRowClassName}>
          <Label
            className="text-[13px]! font-[400]! text-[#546176]! pt-[11px]! leading-[1.6]! max-[560px]:pt-0!"
            htmlFor={id + '-name'}
          >
            Imię i nazwisko
          </Label>
          <div className="flex flex-col gap-[8px] min-w-0">
            <Input
              className={inputClassName}
              id={id + '-name'}
              autoComplete="name"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? id + '-name-error' : undefined}
              {...register('name')}
            />
            <FieldError
              id={id + '-name-error'}
              message={errors.name?.message}
            />
          </div>
        </div>
        <div className={fieldRowClassName}>
          <Label
            className="text-[13px]! font-[400]! text-[#546176]! pt-[11px]! leading-[1.6]! max-[560px]:pt-0!"
            htmlFor={id + '-email'}
          >
            Adres e-mail
          </Label>
          <div className="flex flex-col gap-[8px] min-w-0">
            <Input
              className={inputClassName}
              id={id + '-email'}
              type="email"
              value={user.email}
              readOnly
              aria-describedby={id + '-email-hint'}
            />
            <p
              className="text-[#8a96a8] text-[12px] leading-[1.6] m-0"
              id={id + '-email-hint'}
            >
              Adres e-mail nie może być tutaj zmieniony.
            </p>
          </div>
        </div>
      </fieldset>
      {errors.root?.server?.message && (
        <p className={errorNoticeClassName} role="alert">
          {errors.root.server.message}
        </p>
      )}
      <div className="[border-top:1px_solid_#e5ebf2] mt-[32px] p-[20px_0]">
        <span className={savedMessageClassName} role="status">
          {saved && (
            <>
              <Check size={15} /> Zapisano zmiany
            </>
          )}
        </span>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { refresh } = useAccount();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormInput, unknown, PasswordFormValues>({
    resolver: standardSchemaResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function save(values: PasswordFormValues) {
    setSaved(false);
    try {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        if (result.error.code === 'INVALID_PASSWORD') {
          setError(
            'currentPassword',
            { message: 'Obecne hasło jest nieprawidłowe.' },
            { shouldFocus: true },
          );
        } else {
          setError('root.server', {
            message:
              result.error.status === 401
                ? 'Sesja wygasła. Zaloguj się ponownie.'
                : 'Nie udało się zmienić hasła. Spróbuj ponownie.',
          });
          if (result.error.status === 401) refresh();
        }
        return;
      }
      reset();
      setSaved(true);
      refresh();
    } catch {
      setError('root.server', {
        message: 'Brak połączenia z serwerem. Spróbuj ponownie.',
      });
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(save)}
      onChange={() => setSaved(false)}
      className="p-0"
      aria-busy={isSubmitting}
    >
      <Button
        className={submitButtonClassName}
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <LoaderCircle
            size={15}
            className="animate-[spin_700ms_linear_infinite] motion-reduce:animate-none"
          />
        )}
        {isSubmitting ? 'Zmienianie hasła…' : 'Zmień hasło'}
      </Button>
      <header className="mb-[27px] max-[560px]:mb-[22px]">
        <h2 className="text-[15px] text-[#2e3d51] font-[550] mb-[7px]">
          Zmiana hasła
        </h2>
        <p className="text-[12px] text-[#8995a6] leading-[1.7]">
          Podaj obecne hasło i ustaw nowe, od 8 do 128 znaków.
        </p>
      </header>
      <fieldset disabled={isSubmitting} className={fieldsetClassName}>
        <PasswordField
          label="Obecne hasło"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          registration={register('currentPassword')}
        />
        <PasswordField
          label="Nowe hasło"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={register('newPassword', { deps: ['confirmPassword'] })}
        />
        <PasswordField
          label="Powtórz nowe hasło"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword')}
        />
      </fieldset>
      {errors.root?.server?.message && (
        <p className={errorNoticeClassName} role="alert">
          {errors.root.server.message}
        </p>
      )}
      <div className="[border-top:1px_solid_#e5ebf2] mt-[32px] p-[20px_0]">
        <span className={savedMessageClassName} role="status">
          {saved && (
            <>
              <Check size={15} /> Hasło zostało zmienione
            </>
          )}
        </span>
      </div>
    </form>
  );
}

export function AccountSettings() {
  return (
    <Tabs.Root
      defaultValue="profile"
      className="p-[44px_48px_48px] m-[0_auto] relative max-w-[1140px] min-h-[100svh] max-[1100px]:p-[36px_32px_32px] max-[800px]:p-[36px_20px] max-[800px]:min-h-[calc(100svh_-_58px)] max-[560px]:px-[16px] max-[560px]:pt-[27px]"
    >
      <header className="pr-[160px] mb-[30px] max-[560px]:pr-0 max-[560px]:mb-[20px]">
        <h1 className="leading-[1.3] mb-[8px] text-[29px] font-[500] tracking-[-0.65px] max-[560px]:text-[27px]">
          Ustawienia konta
        </h1>
        <p className="text-[#7a8799] leading-[1.6] text-[13px]">
          Zarządzaj swoimi danymi i bezpieczeństwem konta.
        </p>
      </header>
      <Tabs.List
        activateOnFocus
        className="flex items-center gap-[25px] [border-bottom:1px_solid_#e3e9f1] mb-[30px] max-[560px]:gap-[17px] max-[560px]:mb-[25px]"
        aria-label="Ustawienia konta"
      >
        <Tabs.Tab className={tabClassName} value="profile">
          <UserRound size={16} /> Dane konta
        </Tabs.Tab>
        <Tabs.Tab className={tabClassName} value="security">
          <KeyRound size={16} /> Hasło i bezpieczeństwo
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        className="[&[hidden]]:hidden"
        value="profile"
        keepMounted
        tabIndex={-1}
      >
        <ProfileForm />
      </Tabs.Panel>
      <Tabs.Panel
        className="[&[hidden]]:hidden"
        value="security"
        keepMounted
        tabIndex={-1}
      >
        <PasswordForm />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
