'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { useAccount } from '@/components/account/account-shell';
import { isAdmin } from '@/lib/user-display';
import { MaintenanceRequestForm } from './maintenance-request-form';

function RequestList({ personal = false }: { personal?: boolean }) {
  return (
    <div className="mx-auto max-w-[1360px] px-7 pb-5 pt-7 max-[1100px]:px-8 max-[800px]:px-5 max-[560px]:px-4">
      <header className="mb-6">
        <h1 className="text-[29px] font-medium leading-[1.3] tracking-[-0.65px] text-[#1c2738] max-[560px]:text-[27px]">
          {personal ? 'Moje zgłoszenia' : 'Zgłoszenia'}
        </h1>
        <p className="mt-2 text-[13px] leading-[1.7] text-[#7a8799]">
          {personal
            ? 'Twoje zgłoszenia usterek i ich statusy.'
            : 'Zgłoszenia usterek od mieszkańców.'}
        </p>
      </header>

      <section
        className="overflow-hidden rounded-xl border border-[#e5eaf1] bg-white"
        aria-labelledby="requests-list-heading"
      >
        <header className="flex items-center gap-2.5 border-b border-[#edf0f5] px-6 py-4 max-[560px]:px-4">
          <ClipboardList
            size={20}
            strokeWidth={1.7}
            className="shrink-0 text-[#0866f5]"
            aria-hidden="true"
          />
          <h2
            id="requests-list-heading"
            className="text-[16px] font-semibold tracking-[-0.3px] text-[#263448]"
          >
            Lista zgłoszeń
          </h2>
        </header>
        <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-xl border border-[#e8edf3] text-[#8794a6]">
            <ClipboardList size={26} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-[16px] font-medium text-[#344054]">
            Brak zgłoszeń do wyświetlenia
          </h3>
          <p className="mt-2 max-w-[340px] text-[13px] leading-[1.7] text-[#8792a2]">
            {personal
              ? 'Tutaj pojawią się Twoje zgłoszenia po wysłaniu ich do administracji.'
              : 'W tym miejscu pojawią się zgłoszenia usterek przesłane przez mieszkańców.'}
          </p>
          {personal && (
            <Link
              href="/requests"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0866f5] px-4 text-[13px] font-medium text-white transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#0057dc] active:not-focus-visible:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-reduce:transform-none"
            >
              Zgłoś usterkę <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export function RequestsView() {
  const { user } = useAccount();
  return isAdmin(user.role) ? <RequestList /> : <MaintenanceRequestForm />;
}

export function MyRequestsView() {
  const { user } = useAccount();
  const router = useRouter();
  const administrator = isAdmin(user.role);

  useEffect(() => {
    if (administrator) router.replace('/requests');
  }, [administrator, router]);

  return administrator ? null : <RequestList personal />;
}
