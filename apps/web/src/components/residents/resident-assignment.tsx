'use client';

import { Popover } from '@base-ui/react/popover';
import { KeyRound } from 'lucide-react';
import { useId, useState } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { getApiErrorMessage } from '@/lib/api/fetch';
import { useBuildingsFindAllWithApartments } from '@/lib/api/generated';

const actionClassName =
  'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dfe5ed] bg-white px-3 text-sm font-medium text-[#344054] enabled:hover:bg-[#f6f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] disabled:opacity-50';

type LocationOption = { id: string; label: string };

export function ResidentAssignment({ residentName }: { residentName: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={'Przypisz mieszkanie: ' + residentName}
        className={actionClassName}
      >
        <KeyRound
          size={15}
          className="shrink-0 text-[#0866f5]"
          aria-hidden="true"
        />
        Przypisz mieszkanie
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8} className="z-50">
          <Popover.Popup className="max-h-(--available-height) w-80 max-w-(--available-width) overflow-y-auto rounded-xl border border-[#e5eaf1] bg-white p-4 text-sm text-[#526077]">
            <Popover.Title className="mb-3 text-sm font-semibold text-[#263448]">
              Przypisz mieszkanie
            </Popover.Title>
            <AssignmentFields />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function AssignmentFields() {
  const id = useId();
  const query = useBuildingsFindAllWithApartments();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [apartmentId, setApartmentId] = useState<string | null>(null);

  const buildings = query.data ?? [];
  const selectedBuilding = buildings.find(
    (building) => building.id === buildingId,
  );
  const buildingOptions = buildings.map(({ id, name, address }) => ({
    id,
    label: name + ' — ' + address,
  }));
  const apartmentOptions = (selectedBuilding?.apartments ?? []).map(
    ({ id, number }) => ({
      id,
      label: 'Mieszkanie ' + number,
    }),
  );

  return (
    <div className="space-y-3">
      {query.isPending ? (
        <p role="status">Ładowanie budynków…</p>
      ) : query.isError ? (
        <div className="space-y-2">
          <p role="alert" className="text-[#a03830]">
            {getApiErrorMessage(query.error)}
          </p>
          <button
            type="button"
            className={actionClassName}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <>
          <LocationCombobox
            id={id + '-building'}
            label="Budynek"
            placeholder={
              buildings.length ? 'Wybierz budynek' : 'Brak budynków do wyboru'
            }
            options={buildingOptions}
            selectedId={buildingId}
            onSelect={(id) => {
              setBuildingId(id);
              setApartmentId(null);
            }}
          />
          <LocationCombobox
            key={buildingId}
            id={id + '-apartment'}
            label="Mieszkanie"
            placeholder={
              !selectedBuilding
                ? 'Najpierw wybierz budynek'
                : apartmentOptions.length
                  ? 'Wybierz mieszkanie'
                  : 'Brak mieszkań w budynku'
            }
            options={apartmentOptions}
            selectedId={apartmentId}
            onSelect={setApartmentId}
          />
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="min-h-9 rounded-md bg-[#0866f5] px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Zapisz przypisanie
        </button>
        <Popover.Close type="button" className={actionClassName}>
          Anuluj
        </Popover.Close>
      </div>
    </div>
  );
}

function LocationCombobox({
  id,
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: LocationOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium text-[#344054]">
        {label}
      </label>
      <Combobox
        items={options}
        value={options.find((option) => option.id === selectedId) ?? null}
        itemToStringValue={(option) => option.label}
        isItemEqualToValue={(option, selected) => option.id === selected.id}
        onValueChange={(option) => onSelect(option?.id ?? null)}
        disabled={!options.length}
        openOnInputClick
      >
        <ComboboxInput
          id={id}
          className="h-9 w-full rounded-md border-[#dfe5ed] bg-white"
          placeholder={placeholder}
          disabled={!options.length}
        />
        <ComboboxContent className="min-w-0 motion-reduce:animate-none">
          <ComboboxList>
            {(option: LocationOption) => (
              <ComboboxItem
                key={option.id}
                value={option}
                className="min-h-9 px-3"
              >
                <span className="min-w-0 wrap-break-word">{option.label}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
