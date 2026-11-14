"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, LoaderCircle, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    if (!isPending && !session && !error) router.replace("/login");
  }, [isPending, session, error, router]);

  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError("Nie udało się wylogować. Spróbuj ponownie.");
      } else {
        router.replace("/login");
        router.refresh();
      }
    } catch {
      setSignOutError("Nie można połączyć się z serwerem. Spróbuj ponownie.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="account-page">
      <div className="account-card">
        <Building2 size={28} strokeWidth={1.5} />
        {isPending ? <p role="status"><LoaderCircle size={16} className="auth-spinner" /> Sprawdzanie sesji…</p> : error ? (
          <><h1>Nie udało się pobrać sesji.</h1><p>Sprawdź połączenie i spróbuj ponownie.</p><Button onClick={() => void refetch()}>Spróbuj ponownie</Button></>
        ) : session ? (
          <>
            <span className="account-status"><Check size={14} /> Zalogowano pomyślnie</span>
            <h1>Witaj, {session.user.name}.</h1>
            <p>{session.user.email}</p>
            {signOutError && <p role="alert" className="auth-error">{signOutError}</p>}
            <Button variant="outline" disabled={signingOut} onClick={() => void signOut()}><LogOut size={16} />{signingOut ? "Wylogowywanie…" : "Wyloguj się"}</Button>
          </>
        ) : <p role="status">Przekierowywanie do logowania…</p>}
      </div>
    </main>
  );
}

