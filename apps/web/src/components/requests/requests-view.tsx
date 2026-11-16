'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { useAccount } from '@/components/account/account-shell';
import { isAdmin } from '@/lib/user-display';
import { MaintenanceRequestForm } from './maintenance-request-form';
import { useIssuesFindAll, useIssuesFindMine } from '@/lib/api/generated';
import { getApiErrorMessage } from '@/lib/api/fetch';
import type { IssueListItem } from '@/lib/api/models';

const issueStatuses = {
  new: {
    label: 'Nowe',
    className: 'border-[#dce8fc] bg-[#f6f9ff] text-[#0866f5]',
  },
  in_progress: {
    label: 'W realizacji',
    className: 'border-[#f4e2b8] bg-[#fffaf0] text-[#966414]',
  },
  resolved: {
    label: 'Rozwiązane',
    className: 'border-[#d8eadf] bg-[#f3faf6] text-[#26734b]',
  },
  rejected: {
    label: 'Odrzucone',
    className: 'border-[#f0d2ce] bg-[#fff6f4] text-[#a03830]',
  },
} satisfies Record<
  IssueListItem['status'],
  { label: string; className: string }
>;

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Warsaw',
});

function RequestItem({
  issue,
  personal,
}: {
  issue: IssueListItem;
  personal: boolean;
}) {
  const status = issueStatuses[issue.status];

  return (
    <li className="min-w-0 px-6 py-5 max-[560px]:px-4">
      <article aria-labelledby={'issue-' + issue.id}>
        <div className="flex items-start justify-between gap-4 max-[560px]:flex-col max-[560px]:gap-2">
          <h3
            id={'issue-' + issue.id}
            className="min-w-0 break-words text-[16px] font-semibold leading-relaxed text-[#263448]"
          >
            {issue.title}
          </h3>
          <span
            className={
              'shrink-0 rounded-md border px-2.5 py-1 text-[12px] font-medium ' +
              status.className
            }
          >
            {status.label}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-[#526077]">
          {issue.description}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] max-[560px]:grid-cols-1">
          <div className="min-w-0">
            <dt className="text-[#8792a2]">Lokalizacja</dt>
            <dd className="mt-1 break-words leading-relaxed text-[#526077]">
              {issue.building.name} — {issue.building.address}
              <span className="block">
                {issue.apartment
                  ? 'Mieszkanie ' + issue.apartment.number
                  : 'Część wspólna'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[#8792a2]">Data zgłoszenia</dt>
            <dd className="mt-1 text-[#526077]">
              <time dateTime={issue.createdAt}>
                {dateFormatter.format(new Date(issue.createdAt))}
              </time>
            </dd>
          </div>
          {!personal && (
            <div className="min-w-0">
              <dt className="text-[#8792a2]">Zgłaszający</dt>
              <dd className="mt-1 break-words leading-relaxed text-[#526077]">
                {issue.reporter ? (
                  <>
                    {issue.reporter.name}
                    <span className="block break-all text-[#8792a2]">
                      {issue.reporter.email}
                    </span>
                  </>
                ) : (
                  'Brak danych zgłaszającego'
                )}
              </dd>
            </div>
          )}
          <div className="min-w-0">
            <dt className="text-[#8792a2]">Numer zgłoszenia</dt>
            <dd className="mt-1 break-all font-mono text-[12px] text-[#66758a]">
              {issue.id}
            </dd>
          </div>
        </dl>
      </article>
    </li>
  );
}

function RequestList({ personal = false }: { personal?: boolean }) {
  const allIssues = useIssuesFindAll({
    query: { enabled: !personal, staleTime: 0 },
  });
  const myIssues = useIssuesFindMine({
    query: { enabled: personal, staleTime: 0 },
  });
  const query = personal ? myIssues : allIssues;
  const issues = query.data ?? [];

  return (
    <div className="mx-auto max-w-[1360px] px-7 pb-5 pt-7 max-[1100px]:px-8 max-[800px]:px-5 max-[560px]:px-4">
      <header className="mb-6">
        <h1 className="text-[29px] font-medium leading-[1.3] tracking-[-0.65px] text-[#1c2738] max-[560px]:text-[27px]">
          {personal ? 'Moje zgłoszenia' : 'Zgłoszenia'}
        </h1>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#7a8799]">
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
            className="text-[17px] font-semibold tracking-[-0.3px] text-[#263448]"
          >
            Lista zgłoszeń
          </h2>
        </header>
        {query.isPending ? (
          <p
            role="status"
            className="px-6 py-12 text-center text-[14px] text-[#8792a2]"
          >
            Ładowanie zgłoszeń…
          </p>
        ) : query.isError ? (
          <div role="alert" className="px-6 py-10 text-center">
            <p className="text-[14px] text-[#a03830]">
              {getApiErrorMessage(query.error)}
            </p>
            <button
              type="button"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              className="mt-4 rounded-md border border-[#dfe5ed] px-4 py-2 text-[14px] text-[#526077] transition-colors duration-150 enabled:hover:bg-[#f6f8fb] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff]"
            >
              {query.isFetching ? 'Ładowanie…' : 'Spróbuj ponownie'}
            </button>
          </div>
        ) : issues.length ? (
          <ul
            aria-label={personal ? 'Moje zgłoszenia' : 'Zgłoszenia mieszkańców'}
            className="divide-y divide-[#edf0f5]"
          >
            {issues.map((issue) => (
              <RequestItem key={issue.id} issue={issue} personal={personal} />
            ))}
          </ul>
        ) : (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-xl border border-[#e8edf3] text-[#8794a6]">
              <ClipboardList size={26} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-[17px] font-medium text-[#344054]">
              Brak zgłoszeń do wyświetlenia
            </h3>
            <p className="mt-2 max-w-[340px] text-[14px] leading-[1.7] text-[#8792a2]">
              {personal
                ? 'Tutaj pojawią się Twoje zgłoszenia po wysłaniu ich do administracji.'
                : 'W tym miejscu pojawią się zgłoszenia usterek przesłane przez mieszkańców.'}
            </p>
            {personal && (
              <Link
                href="/requests"
                className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0866f5] px-4 text-[14px] font-medium text-white transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#0057dc] active:not-focus-visible:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-reduce:transform-none"
              >
                Zgłoś usterkę <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
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
