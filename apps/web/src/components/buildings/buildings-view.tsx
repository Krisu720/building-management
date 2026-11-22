'use client';

import { Building2, ChevronRight, House } from 'lucide-react';
import { useId, useState } from 'react';
import { useAccount } from '@/components/account/account-shell';
import type { Apartment, Building } from '@/lib/api/models';
import { isAdmin } from '@/lib/user-display';

type BuildingRow = Pick<Building, 'id' | 'name' | 'address' | 'createdAt'> & {
  apartments: readonly Pick<Apartment, 'id' | 'number'>[];
};

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeZone: 'Europe/Warsaw',
});

export function BuildingsView() {
  const { user } = useAccount();

  return (
    <div className="mx-auto max-w-[1360px] px-7 pb-5 pt-7 max-[1100px]:px-8 max-[800px]:px-5 max-[560px]:px-4">
      <header className="mb-6">
        <h1 className="text-[29px] font-medium leading-[1.3] tracking-[-0.65px] text-[#1c2738] max-[560px]:text-[27px]">
          Budynki
        </h1>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#7a8799]">
          Budynki i przypisane do nich mieszkania.
        </p>
      </header>
      {isAdmin(user.role) ? (
        <BuildingsTable buildings={[]} />
      ) : (
        <p className="text-sm text-[#526077]">
          Ta strona jest dostępna dla administratora.
        </p>
      )}
    </div>
  );
}

function BuildingsTable({ buildings }: { buildings: readonly BuildingRow[] }) {
  return (
    <section
      aria-labelledby="buildings-list"
      className="overflow-hidden rounded-xl border border-[#e5eaf1] bg-white"
    >
      <header className="flex items-center gap-2.5 border-b border-[#edf0f5] px-6 py-4 max-[560px]:px-4">
        <Building2
          size={20}
          strokeWidth={1.7}
          className="shrink-0 text-[#0866f5]"
          aria-hidden="true"
        />
        <h2
          id="buildings-list"
          className="text-[17px] font-semibold tracking-[-0.3px] text-[#263448]"
        >
          Lista budynków
        </h2>
      </header>
      <div
        role="region"
        aria-labelledby="buildings-list"
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#6ea8ff]"
      >
        <table className="w-full min-w-[580px] table-fixed text-sm [&_:is(th,td)]:px-6 max-[560px]:[&_:is(th,td)]:px-4">
          <thead className="bg-[#fcfcfd] text-left text-[#475569] [&_th]:py-3 [&_th]:font-medium">
            <tr>
              <th scope="col" className="w-[30%]">
                Nazwa budynku
              </th>
              <th scope="col" className="w-[34%]">
                Adres
              </th>
              <th scope="col" className="w-[16%]">
                Mieszkania
              </th>
              <th scope="col">Data dodania</th>
            </tr>
          </thead>
          <tbody className="border-t border-[#edf0f5] text-[#526077]">
            {buildings.length ? (
              buildings.map((building) => (
                <BuildingTableRow key={building.id} building={building} />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-10 text-center">
                  Brak budynków do wyświetlenia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BuildingTableRow({ building }: { building: BuildingRow }) {
  const [expanded, setExpanded] = useState(false);
  const apartmentsId = useId();
  const { apartments } = building;

  return (
    <>
      <tr className="border-b border-[#edf0f5] last:border-b-0">
        <th scope="row" className="py-2 text-left font-medium text-[#263448]">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={apartmentsId}
            onClick={() => setExpanded(!expanded)}
            className="-ml-2 flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none enabled:hover:bg-[#f6f8fb] focus-visible:ring-2 focus-visible:ring-[#6ea8ff] motion-safe:active:not-focus-visible:scale-[0.98]"
          >
            <ChevronRight
              size={16}
              aria-hidden="true"
              className={
                expanded
                  ? 'shrink-0 rotate-90 text-[#0866f5]'
                  : 'shrink-0 text-[#64748b]'
              }
            />
            <span className="min-w-0 wrap-break-word">{building.name}</span>
          </button>
        </th>
        <td className="wrap-break-word py-4">{building.address}</td>
        <td className="py-4 tabular-nums">{apartments.length}</td>
        <td className="py-4 tabular-nums">
          <time dateTime={building.createdAt}>
            {dateFormatter.format(new Date(building.createdAt))}
          </time>
        </td>
      </tr>
      <tr
        id={apartmentsId}
        hidden={!expanded}
        className="border-b border-[#edf0f5] bg-[#fcfcfd] last:border-b-0"
      >
        <td colSpan={4} className="py-4">
          <h3 className="font-medium text-[#263448]">Mieszkania w budynku</h3>
          {apartments.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {apartments.map((apartment) => (
                <li
                  key={apartment.id}
                  className="inline-flex items-center gap-2 rounded-md border border-[#e5eaf1] bg-white px-3 py-2"
                >
                  <House
                    size={15}
                    strokeWidth={1.7}
                    className="shrink-0 text-[#64748b]"
                    aria-hidden="true"
                  />
                  <span className="wrap-break-word">
                    Mieszkanie {apartment.number}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">Brak mieszkań w tym budynku.</p>
          )}
        </td>
      </tr>
    </>
  );
}
