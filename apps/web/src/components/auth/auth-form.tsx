"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function errorMessage(code?: string) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "USER_NOT_FOUND":
      return "Nieprawidłowy adres e-mail lub hasło. Spróbuj ponownie.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Nie udało się utworzyć konta. Jeśli masz już konto, przejdź do logowania.";
    case "PASSWORD_TOO_SHORT":
      return "Hasło musi mieć co najmniej 8 znaków.";
    case "PASSWORD_TOO_LONG":
      return "Hasło może mieć maksymalnie 128 znaków.";
    case "TOO_MANY_REQUESTS":
      return "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.";
    default:
      return "Nie udało się wykonać operacji. Spróbuj ponownie za chwilę.";
  }
}

type AuthFormValues = {
  name: string;
  email: string;
  password: string;
  remember: boolean;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="auth-field-error" role="alert">{message}</p> : null;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const router = useRouter();
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: pending },
  } = useForm<AuthFormValues>({
    defaultValues: { name: "", email: "", password: "", remember: true },
    shouldUnregister: true,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function showServerError(message: string) {
    setError("root.server", { type: "server", message });
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function onSubmit(values: AuthFormValues) {
    try {
      const result = registering
        ? await authClient.signUp.email({ name: values.name, email: values.email, password: values.password })
        : await authClient.signIn.email({ email: values.email, password: values.password, rememberMe: values.remember });
      if (result.error) {
        showServerError(result.error.status >= 500
          ? "Serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę."
          : errorMessage(result.error.code));
      } else {
        router.replace("/account");
        router.refresh();
      }
    } catch {
      showServerError("Nie można połączyć się z serwerem. Sprawdź połączenie i spróbuj ponownie.");
    }
  }

  return (
    <>
      <div className="auth-form-heading">
        <span className="auth-form-kicker">Panel zarządzania nieruchomościami</span>
        <h1>{registering ? "Utwórz konto" : "Zaloguj się"}</h1>
        <p>{registering ? "Podaj swoje dane, aby założyć konto." : "Wpisz swój e-mail i hasło."}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form" aria-busy={pending}>
        {registering && (
          <div className="auth-field">
            <Label htmlFor={id + "-name"}>Imię i nazwisko</Label>
            <div className="auth-input-wrap">
              <UserRound size={17} aria-hidden="true" />
              <Input
                id={id + "-name"}
                placeholder="Jan Kowalski"
                autoComplete="name"
                readOnly={pending}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? id + "-name-error" : undefined}
                {...register("name", {
                  required: "Wpisz imię i nazwisko.",
                  maxLength: { value: 100, message: "Imię i nazwisko może mieć maksymalnie 100 znaków." },
                  setValueAs: (value: string) => value.trim(),
                })}
              />
            </div>
            <FieldError id={id + "-name-error"} message={errors.name?.message} />
          </div>
        )}
        <div className="auth-field">
          <Label htmlFor={id + "-email"}>Adres e-mail</Label>
          <div className="auth-input-wrap">
            <Mail size={17} aria-hidden="true" />
            <Input
              id={id + "-email"}
              type="email"
              placeholder="jan@przyklad.pl"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              readOnly={pending}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? id + "-email-error" : undefined}
              {...register("email", {
                required: "Wpisz adres e-mail.",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Wpisz poprawny adres e-mail." },
                setValueAs: (value: string) => value.trim(),
              })}
            />
          </div>
          <FieldError id={id + "-email-error"} message={errors.email?.message} />
        </div>
        <div className="auth-field">
          <Label htmlFor={id + "-password"}>Hasło</Label>
          <div className="auth-input-wrap auth-password-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <Input
              id={id + "-password"}
              type={showPassword ? "text" : "password"}
              placeholder={registering ? "Utwórz bezpieczne hasło" : "Wpisz swoje hasło"}
              autoComplete={registering ? "new-password" : "current-password"}
              readOnly={pending}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={[registering ? id + "-hint" : "", errors.password ? id + "-password-error" : ""].filter(Boolean).join(" ") || undefined}
              {...register("password", {
                required: "Wpisz hasło.",
                minLength: { value: registering ? 8 : 1, message: "Hasło musi mieć co najmniej 8 znaków." },
                maxLength: { value: 128, message: "Hasło może mieć maksymalnie 128 znaków." },
              })}
            />
            <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"} aria-pressed={showPassword} disabled={pending}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {registering && <p className="auth-hint" id={id + "-hint"}>Od 8 do 128 znaków.</p>}
          <FieldError id={id + "-password-error"} message={errors.password?.message} />
        </div>

        {!registering && (
          <label className="auth-remember">
            <input type="checkbox" disabled={pending} {...register("remember")} />
            <span>Zapamiętaj mnie</span>
          </label>
        )}

        {errors.root?.server?.message && (
          <div className="auth-error" role="alert" tabIndex={-1} ref={errorRef}>{errors.root.server.message}</div>
        )}

        <Button type="submit" disabled={pending} className="auth-submit">
          {pending ? <><LoaderCircle size={17} className="auth-spinner" aria-hidden="true" />{registering ? "Tworzenie konta…" : "Logowanie…"}</> : <>{registering ? "Utwórz konto" : "Zaloguj się"}<ArrowRight size={17} aria-hidden="true" /></>}
        </Button>
      </form>

      <div className="auth-switch">
        {registering ? "Masz już konto?" : "Nie masz jeszcze konta?"}{" "}
        <Link href={registering ? "/login" : "/register"}>{registering ? "Zaloguj się" : "Utwórz konto"}<ArrowRight size={13} aria-hidden="true" /></Link>
      </div>
    </>
  );
}
