import Image from 'next/image';
import type { ReactNode } from 'react';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100svh] grid place-items-center p-[48px_clamp(32px,_4vw,_72px)] bg-[#f7f9fc] text-[#192333] max-[760px]:p-[16px]">
      <div className="grid grid-cols-[minmax(0,_0.88fr)_minmax(0,_1.12fr)] w-full max-w-[1480px] min-h-[calc(100svh_-_96px)] bg-white [border:1px_solid_#e7ecf2] rounded-[18px] shadow-[0_4px_24px_#172a4605,_0_1px_3px_#172a4603] overflow-hidden max-[760px]:block max-[760px]:min-h-[calc(100svh_-_32px)] max-[760px]:rounded-[14px]">
        <aside
          className="relative flex items-end m-[10px] p-[38px] overflow-hidden rounded-[12px] bg-[#dceafa] isolate text-white min-h-0 max-[1050px]:p-[36px] max-[760px]:hidden"
          aria-label="Zarządzanie budynkami"
        >
          <Image
            src="/images/auth-architecture.webp"
            alt="Nowoczesne budynki z jasnymi fasadami i zielonym dziedzińcem"
            fill
            priority
            sizes="(max-width: 760px) 1px, 50vw"
            className="object-cover [object-position:55%_center] z-[-2]"
          />
          <div className="absolute [inset:0] [background:linear-gradient(_180deg,_#0d2c5020_0%,_transparent_32%,_#0a25454a_52%,_#081e3ee0_100%_)] z-[-1]" />
          <div className="pt-[220px] pb-[16px]">
            <h2 className="m-[0_0_18px] text-[clamp(30px,_3.1vw,_46px)] font-[550] leading-[1.16] tracking-[-1.6px] max-[1050px]:text-[33px]">
              Od zgłoszenia
              <br />
              do rozwiązania.
            </h2>
            <p className="text-[13px] leading-[1.8] text-[#dbe5f1]">
              Zaloguj się, żeby przejść do panelu.
            </p>
          </div>
        </aside>
        <div className="flex flex-col justify-center min-w-0 p-[48px_36px] max-[1050px]:p-[35px_30px_25px] max-[760px]:min-h-[calc(100svh_-_34px)] max-[760px]:p-[40px_24px] max-[380px]:px-[20px]">
          <main className="w-full max-w-[450px] m-auto p-[24px_0] max-[760px]:p-[24px_0]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
