'use client';

import { Users } from 'lucide-react';
import { useAccount } from '@/components/account/account-shell';
import { getApiErrorMessage } from '@/lib/api/fetch';
import { useResidentsFindAll } from '@/lib/api/generated';
import type { ResidentListItem } from '@/lib/api/models';
import { getInitials, isAdmin } from '@/lib/user-display';
import { ResidentAssignment } from './resident-assignment';

const headingCell = 'py-3 text-left font-medium text-[#475569]';
const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeZone: 'Europe/Warsaw',
});

export function ResidentsView() {
  const { user } = useAccount();
  const administrator = isAdmin(user.role);

  return (
    <div className="mx-auto max-w-[1360px] px-7 pb-5 pt-7 max-[1100px]:px-8 max-[800px]:px-5 max-[560px]:px-4">
      <header className="mb-6">
        <h1 className="text-[29px] font-medium leading-[1.3] tracking-[-0.65px] text-[#1c2738] max-[560px]:text-[27px]">
          Mieszkańcy
        </h1>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#7a8799]">
          Dane mieszkańców i przypisane mieszkania.
        </p>
      </header>
      {administrator ? (
        <ResidentsSection />
      ) : (
        <p className="text-sm text-[#526077]">
          Ta strona jest dostępna dla administratora.
        </p>
      )}
    </div>
  );
}

function ResidentsSection() {
  const query = useResidentsFindAll({ query: { staleTime: 0 } });
  const residents = query.data ?? [];

  return (
    <section
      aria-labelledby="residents-list"
      className="overflow-hidden rounded-xl border border-[#e5eaf1] bg-white"
    >
      <header className="flex items-center gap-2.5 border-b border-[#edf0f5] px-6 py-4 max-[560px]:px-4">
        <Users
          size={20}
          strokeWidth={1.7}
          className="shrink-0 text-[#0866f5]"
          aria-hidden="true"
        />
        <h2
          id="residents-list"
          className="text-[17px] font-semibold tracking-[-0.3px] text-[#263448]"
        >
          Lista mieszkańców
        </h2>
      </header>
      {query.isPending ? (
        <p
          role="status"
          className="px-6 py-12 text-center text-[14px] text-[#8792a2]"
        >
          Ładowanie mieszkańców…
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
      ) : (
        <ResidentsTable residents={residents} />
      )}
    </section>
  );
}

function ResidentsTable({
  residents,
}: {
  residents: readonly ResidentListItem[];
}) {
  return (
    <div
      role="region"
      aria-labelledby="residents-list"
      tabIndex={0}
      className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#6ea8ff]"
    >
      <table className="w-full min-w-[680px] table-fixed text-sm [&_:is(th,td)]:px-6 max-[560px]:[&_:is(th,td)]:px-4">
        <thead className="bg-[#fcfcfd]">
          <tr>
            <th scope="col" className={headingCell + ' w-[26%]'}>
              Mieszkaniec
            </th>
            <th scope="col" className={headingCell + ' w-[27%]'}>
              E-mail
            </th>
            <th scope="col" className={headingCell + ' w-[30%]'}>
              Budynek i mieszkanie
            </th>
            <th scope="col" className={headingCell}>
              Data rejestracji
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0f5] border-t border-[#edf0f5] text-[#526077]">
          {residents.length ? (
            residents.map((resident) => (
              <tr key={resident.id}>
                <th
                  scope="row"
                  className="py-4 text-left font-medium text-[#263448]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#e5eaf1] text-xs text-[#546176]"
                    >
                      {getInitials(resident.name)}
                    </span>
                    <span className="min-w-0 wrap-break-word">
                      {resident.name}
                    </span>
                  </div>
                </th>
                <td className="wrap-break-word py-4">{resident.email}</td>
                <td className="wrap-break-word py-4">
                  {resident.apartmentNumber === null ? (
                    <ResidentAssignment residentName={resident.name} />
                  ) : (
                    <>
                      <span className="block font-medium text-[#263448]">
                        {resident.buildingName}
                      </span>
                      <span className="block">
                        {resident.buildingAddress} · mieszkanie{' '}
                        {resident.apartmentNumber}
                      </span>
                    </>
                  )}
                </td>
                <td className="py-4 tabular-nums">
                  <time dateTime={resident.createdAt}>
                    {dateFormatter.format(new Date(resident.createdAt))}
                  </time>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-10 text-center text-[#526077]">
                Brak mieszkańców do wyświetlenia.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
