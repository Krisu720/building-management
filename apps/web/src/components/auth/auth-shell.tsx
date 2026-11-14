import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-frame">
      <aside className="auth-story" aria-label="Zarządzanie budynkami">
        <Image
          src="/images/auth-architecture.webp"
          alt="Nowoczesne budynki z jasnymi fasadami i zielonym dziedzińcem"
          fill
          priority
          sizes="(max-width: 760px) 1px, 50vw"
          className="auth-photo"
        />
        <div className="auth-photo-shade" />
        <div className="auth-story-content">
          <h2>Od zgłoszenia<br />do rozwiązania.</h2>
          <p>Zaloguj się, żeby przejść do panelu.</p>
        </div>
      </aside>
      <div className="auth-main">
        <main className="auth-form-container">{children}</main>
      </div>
      </div>
    </div>
  );
}

