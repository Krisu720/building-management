'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ChevronDown,
  House,
  LoaderCircle,
  UsersRound,
  Wrench,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useAccount } from '@/components/account/account-shell';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { FieldError } from '@/components/ui/field-error';
import { getApiErrorMessage } from '@/lib/api/fetch';
import {
  getInspectionsFindAllQueryKey,
  getInspectionsFindMineQueryKey,
  useBuildingsFindAllWithApartments,
  useInspectionsCreate,
  useInspectionsFindAll,
  useInspectionsFindMine,
  useUsersFindAll,
} from '@/lib/api/generated';
import type { InspectionListItem } from '@/lib/api/models';
import { isAdmin } from '@/lib/user-display';
import {
  createInspectionFormSchema,
  getInspectionTechnicians,
  getInspectionTypeLabel,
  inspectionTypeLabelLimit,
  inspectionTypeSuggestions,
  type InspectionBuilding,
  type InspectionFormInput,
  type InspectionFormValues,
  type InspectionUser,
} from './inspection-form-schema';

const defaultValues: InspectionFormInput = {
  scope: 'building',
  typeLabel: '',
  technicianId: '',
  buildingId: '',
  apartmentIds: [],
  scheduledDate: '',
  scheduledTime: '',
};

const emptyBuildings: readonly InspectionBuilding[] = [];
const emptyUsers: readonly InspectionUser[] = [];

const scopeOptions = [
  { value: 'building', label: 'Część wspólna', icon: Building2 },
  { value: 'apartment', label: 'Wybrane mieszkania', icon: House },
] as const;

const inspectionStatuses = {
  scheduled: {
    label: 'Zaplanowany',
    className: 'border-[#dce8fc] bg-[#f6f9ff] text-[#0866f5]',
  },
  in_progress: {
    label: 'W trakcie',
    className: 'border-[#f4e2b8] bg-[#fffaf0] text-[#966414]',
  },
  completed: {
    label: 'Zakończony',
    className: 'border-[#d8eadf] bg-[#f3faf6] text-[#26734b]',
  },
  cancelled: {
    label: 'Anulowany',
    className: 'border-[#f0d2ce] bg-[#fff6f4] text-[#a03830]',
  },
} satisfies Record<
  InspectionListItem['status'],
  { label: string; className: string }
>;

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Warsaw',
});

const fieldClassName =
  'h-10 w-full min-w-0 rounded-md border border-[#dfe5ed] bg-white px-3 text-sm text-[#344054] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#70a8fa] aria-invalid:border-[#d56a61] disabled:bg-[#f7f8fa] disabled:text-[#66758a] max-[560px]:min-h-11 max-[560px]:text-base';

const sectionClassName =
  'min-w-0 overflow-hidden rounded-xl border border-[#e5eaf1] bg-white';
const sectionHeadingClassName =
  'flex items-center gap-2.5 border-b border-[#edf0f5] px-6 py-4 text-[17px] font-semibold text-[#263448] max-[560px]:px-4';

type InspectionConfirmation = {
  typeLabel: string;
  technicianName: string | undefined;
  location: string;
  scheduledAt: string;
  count: number;
};

export function InspectionsView() {
  const { user } = useAccount();
  const administrator = isAdmin(user.role);

  return (
    <div className="mx-auto max-w-[1360px] px-7 pb-5 pt-7 max-[1100px]:px-8 max-[800px]:px-5 max-[560px]:px-4">
      <header className="mb-6">
        <h1 className="text-[29px] font-medium leading-[1.3] tracking-[-0.65px] text-[#1c2738] max-[560px]:text-[27px]">
          Przeglądy techniczne
        </h1>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#7a8799]">
          {administrator
            ? 'Planuj przeglądy części wspólnych i mieszkań.'
            : 'Terminy przeglądów dotyczących Twojego budynku i mieszkania.'}
        </p>
      </header>
      {administrator ? (
        <AdminInspectionsSection />
      ) : (
        <InspectionsListSection personal />
      )}
    </div>
  );
}

function AdminInspectionsSection() {
  const buildingsQuery = useBuildingsFindAllWithApartments();
  const usersQuery = useUsersFindAll({ role: 'technician' });

  return (
    <div className="space-y-6">
      <InspectionForm
        buildings={buildingsQuery.data ?? emptyBuildings}
        buildingsLoading={buildingsQuery.isPending}
        buildingsError={buildingsQuery.isError ? buildingsQuery.error : null}
        onRetryBuildings={() => void buildingsQuery.refetch()}
        buildingsFetching={buildingsQuery.isFetching}
        users={usersQuery.data ?? emptyUsers}
        usersLoading={usersQuery.isPending}
        usersError={usersQuery.isError ? usersQuery.error : null}
        onRetryUsers={() => void usersQuery.refetch()}
        usersFetching={usersQuery.isFetching}
      />
      <InspectionsListSection personal={false} />
    </div>
  );
}

function InspectionsListSection({ personal }: { personal: boolean }) {
  const allQuery = useInspectionsFindAll({
    query: { enabled: !personal, staleTime: 0 },
  });
  const mineQuery = useInspectionsFindMine({
    query: { enabled: personal, staleTime: 0 },
  });
  const query = personal ? mineQuery : allQuery;
  const inspections = query.data ?? [];

  return (
    <section className={sectionClassName}>
      <h2 className={sectionHeadingClassName}>
        <CalendarCheck
          size={20}
          strokeWidth={1.7}
          className="text-[#0866f5]"
          aria-hidden="true"
        />
        {personal ? 'Moje przeglądy' : 'Zaplanowane przeglądy'}
      </h2>
      {query.isPending ? (
        <p
          role="status"
          className="px-6 py-10 text-center text-sm text-[#8792a2]"
        >
          Ładowanie przeglądów…
        </p>
      ) : query.isError ? (
        <div role="alert" className="px-6 py-10 text-center">
          <p className="text-sm text-[#a03830]">
            {getApiErrorMessage(query.error)}
          </p>
          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="mt-4 rounded-md border border-[#dfe5ed] px-4 py-2 text-sm text-[#526077] transition-colors duration-150 enabled:hover:bg-[#f6f8fb] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff]"
          >
            {query.isFetching ? 'Ładowanie…' : 'Spróbuj ponownie'}
          </button>
        </div>
      ) : inspections.length ? (
        <ul
          aria-label={personal ? 'Moje przeglądy' : 'Zaplanowane przeglądy'}
          className="divide-y divide-[#edf0f5]"
        >
          {inspections.map((inspection) => {
            const status = inspectionStatuses[inspection.status];
            return (
              <li
                key={inspection.id}
                className="min-w-0 px-6 py-5 max-[560px]:px-4"
              >
                <article aria-labelledby={'inspection-' + inspection.id}>
                  <div className="flex items-start justify-between gap-4 max-[560px]:flex-col max-[560px]:gap-2">
                    <h3
                      id={'inspection-' + inspection.id}
                      className="min-w-0 wrap-break-word text-[16px] font-semibold leading-relaxed text-[#263448]"
                    >
                      {getInspectionTypeLabel(inspection)}
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
                  <dl className="mt-3 grid grid-cols-3 gap-x-6 gap-y-3 text-[13px] max-[700px]:grid-cols-1">
                    <div className="min-w-0">
                      <dt className="text-[#8792a2]">Lokalizacja</dt>
                      <dd className="mt-1 wrap-break-word leading-relaxed text-[#526077]">
                        {inspection.building.name} — {inspection.building.address}
                        <span className="block">
                          {inspection.apartment
                            ? 'Mieszkanie ' + inspection.apartment.number
                            : 'Część wspólna'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#8792a2]">Termin</dt>
                      <dd className="mt-1 text-[#526077]">
                        <time dateTime={inspection.scheduledAt}>
                          {dateFormatter.format(new Date(inspection.scheduledAt))}
                        </time>
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[#8792a2]">Technik</dt>
                      <dd className="mt-1 wrap-break-word text-[#526077]">
                        {inspection.technician
                          ? inspection.technician.name
                          : 'Bez przypisania'}
                      </dd>
                    </div>
                  </dl>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-6 py-10 text-center text-sm text-[#526077]">
          Brak przeglądów do wyświetlenia.
        </p>
      )}
    </section>
  );
}

function InspectionSelect(props: ComponentPropsWithRef<'select'>) {
  return (
    <div className="relative">
      <select {...props} className={fieldClassName + ' appearance-none pr-9'} />
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#66758a]"
      />
    </div>
  );
}

function InspectionField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#344054]">
        {label}
      </label>
      {children}
      <FieldError id={id + '-error'} message={error} />
    </div>
  );
}

function InspectionForm({
  buildings,
  buildingsLoading,
  buildingsError,
  onRetryBuildings,
  buildingsFetching,
  users,
  usersLoading,
  usersError,
  onRetryUsers,
  usersFetching,
}: {
  buildings: readonly InspectionBuilding[];
  buildingsLoading: boolean;
  buildingsError: unknown;
  onRetryBuildings: () => void;
  buildingsFetching: boolean;
  users: readonly InspectionUser[];
  usersLoading: boolean;
  usersError: unknown;
  onRetryUsers: () => void;
  usersFetching: boolean;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const createInspection = useInspectionsCreate();
  const submissionInFlight = useRef(false);
  const [confirmation, setConfirmation] =
    useState<InspectionConfirmation | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const technicians = getInspectionTechnicians(users);
  const {
    control,
    register,
    reset,
    resetField,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InspectionFormInput, unknown, InspectionFormValues>({
    defaultValues,
    resolver: (values, context, options) =>
      standardSchemaResolver(
        createInspectionFormSchema(buildings, technicians),
      )(values, context, options),
  });

  const { field: typeField } = useController({ control, name: 'typeLabel' });
  const customType = typeField.value.trim();
  const isSuggestedType = inspectionTypeSuggestions.some(
    (label) => label === customType,
  );
  const typeOptions =
    customType && !isSuggestedType
      ? [...inspectionTypeSuggestions, customType]
      : inspectionTypeSuggestions;
  const { field: apartmentField } = useController({
    control,
    name: 'apartmentIds',
  });
  const [scope, buildingId] = useWatch({
    control,
    name: ['scope', 'buildingId'],
  });
  const selectedBuilding = buildings.find(
    (building) => building.id === buildingId,
  );
  const apartments = selectedBuilding?.apartments ?? [];
  const selectedApartments = apartments.filter(({ id }) =>
    apartmentField.value.includes(id),
  );
  const isSending = isSubmitting || createInspection.isPending;

  useEffect(() => {
    if (confirmation) confirmationRef.current?.focus();
  }, [confirmation]);

  function clearApartments() {
    resetField('apartmentIds');
  }

  function updateType(value: string) {
    typeField.onChange(value);
    setConfirmation(null);
    clearErrors('root.server');
  }

  async function submitInspection(values: InspectionFormValues) {
    if (submissionInFlight.current) return;
    const building = buildings.find(({ id }) => id === values.buildingId);
    if (!building) {
      setError('buildingId', { message: 'Wybierz budynek z listy.' });
      return;
    }

    submissionInFlight.current = true;
    clearErrors('root.server');
    try {
      const created = await createInspection.mutateAsync({
        data: {
          scope: values.scope,
          type: values.type,
          ...(values.type === 'other' && values.typeLabel
            ? { typeLabel: values.typeLabel }
            : {}),
          buildingId: values.buildingId,
          apartmentIds:
            values.scope === 'apartment' ? values.apartmentIds : undefined,
          technicianId: values.technicianId || null,
          scheduledAt: values.scheduledAt,
        },
      });
      void queryClient.invalidateQueries({
        queryKey: getInspectionsFindAllQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: getInspectionsFindMineQueryKey(),
      });

      const target =
        values.scope === 'building'
          ? 'Część wspólna'
          : 'Mieszkania: ' +
            building.apartments
              .filter(({ id }) => values.apartmentIds.includes(id))
              .map(({ number }) => number)
              .join(', ');

      setConfirmation({
        typeLabel: getInspectionTypeLabel(values),
        technicianName: technicians.find(({ id }) => id === values.technicianId)
          ?.name,
        location: building.name + ', ' + building.address + ' · ' + target,
        scheduledAt: values.scheduledAt,
        count: created.length,
      });
      reset(defaultValues);
    } catch (error) {
      setError('root.server', { message: getApiErrorMessage(error) });
    } finally {
      submissionInFlight.current = false;
    }
  }

  return (
    <div className="grid items-start gap-5 min-[1151px]:grid-cols-[minmax(0,1fr)_340px]">
      <section className={sectionClassName}>
        <h2 className={sectionHeadingClassName}>
          <Wrench
            size={20}
            strokeWidth={1.7}
            className="text-[#0866f5]"
            aria-hidden="true"
          />
          Zaplanuj przegląd
        </h2>
        <form
          noValidate
          onSubmit={handleSubmit(submitInspection)}
          onChange={() => {
            setConfirmation(null);
            clearErrors('root.server');
          }}
          aria-busy={isSending}
          className="space-y-5 p-6 max-[560px]:p-4"
        >
          <fieldset disabled={isSending} className="min-w-0 space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[#344054]">
                Zakres przeglądu
              </legend>
              <div className="grid gap-2 min-[480px]:grid-cols-2">
                {scopeOptions.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-[#dfe5ed] px-3 text-sm text-[#526077] has-checked:border-[#86b6fa] has-checked:bg-[#f6f9ff] has-checked:text-[#1456a8] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#70a8fa]"
                  >
                    <input
                      type="radio"
                      value={value}
                      className="size-4 shrink-0 accent-[#0866f5]"
                      {...register('scope', { onChange: clearApartments })}
                    />
                    <Icon size={17} aria-hidden="true" className="shrink-0" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 min-[560px]:grid-cols-2">
              <InspectionField
                id={id + '-type'}
                label="Rodzaj przeglądu"
                error={errors.typeLabel?.message}
              >
                <Combobox
                  items={typeOptions}
                  inputValue={typeField.value}
                  value={customType || null}
                  openOnInputClick
                  onInputValueChange={(value, details) => {
                    if (
                      details.reason === 'input-change' ||
                      details.reason === 'input-clear'
                    ) {
                      updateType(value);
                    }
                  }}
                  onValueChange={(value) => updateType(value ?? '')}
                >
                  <ComboboxInput
                    ref={typeField.ref}
                    id={id + '-type'}
                    onBlur={typeField.onBlur}
                    className="h-10 w-full rounded-md border-[#dfe5ed] bg-white ps-0 text-[#344054] [&_input]:px-3 max-[560px]:min-h-11"
                    placeholder="Wybierz lub wpisz własny rodzaj"
                    aria-invalid={!!errors.typeLabel}
                    aria-describedby={
                      errors.typeLabel ? id + '-type-error' : undefined
                    }
                    aria-required="true"
                    maxLength={inspectionTypeLabelLimit}
                  />
                  <ComboboxContent className="min-w-0 border border-[#dfe5ed] bg-white text-[#344054] motion-reduce:animate-none">
                    <ComboboxList>
                      {(label: string) => (
                        <ComboboxItem
                          key={label}
                          value={label}
                          className="min-h-9 px-3 data-highlighted:bg-[#f6f9ff]"
                        >
                          {!isSuggestedType && label === customType
                            ? 'Użyj: ' + label
                            : label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </InspectionField>
              <InspectionField
                id={id + '-building'}
                label="Budynek"
                error={errors.buildingId?.message}
              >
                <InspectionSelect
                  id={id + '-building'}
                  aria-invalid={!!errors.buildingId}
                  aria-describedby={
                    errors.buildingId ? id + '-building-error' : undefined
                  }
                  disabled={
                    buildingsLoading || !!buildingsError || !buildings.length
                  }
                  required
                  {...register('buildingId', { onChange: clearApartments })}
                >
                  <option value="">
                    {buildingsLoading
                      ? 'Ładowanie budynków…'
                      : buildingsError
                        ? 'Nie udało się pobrać budynków'
                        : buildings.length
                          ? 'Wybierz budynek'
                          : 'Brak budynków do wyboru'}
                  </option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name} — {building.address}
                    </option>
                  ))}
                </InspectionSelect>
                {!!buildingsError && (
                  <p className="text-xs text-[#a03830]">
                    {getApiErrorMessage(buildingsError)}{' '}
                    <button
                      type="button"
                      disabled={buildingsFetching}
                      onClick={onRetryBuildings}
                      className="font-medium text-[#0866f5] underline underline-offset-2 disabled:opacity-50"
                    >
                      Spróbuj ponownie
                    </button>
                  </p>
                )}
              </InspectionField>
            </div>

            <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 min-[560px]:grid-cols-2">
              <InspectionField
                id={id + '-date'}
                label="Data"
                error={errors.scheduledDate?.message}
              >
                <input
                  type="date"
                  id={id + '-date'}
                  className={fieldClassName}
                  aria-invalid={!!errors.scheduledDate}
                  aria-describedby={
                    errors.scheduledDate ? id + '-date-error' : undefined
                  }
                  required
                  {...register('scheduledDate', { deps: 'scheduledTime' })}
                />
              </InspectionField>
              <InspectionField
                id={id + '-time'}
                label="Godzina"
                error={errors.scheduledTime?.message}
              >
                <input
                  type="time"
                  id={id + '-time'}
                  className={fieldClassName}
                  aria-invalid={!!errors.scheduledTime}
                  aria-describedby={
                    errors.scheduledTime ? id + '-time-error' : undefined
                  }
                  required
                  {...register('scheduledTime')}
                />
              </InspectionField>
            </div>

            {scope === 'apartment' && (
              <fieldset
                aria-describedby={
                  errors.apartmentIds ? id + '-apartments-error' : undefined
                }
                className="space-y-2"
              >
                <legend className="mb-2 text-sm font-medium text-[#344054]">
                  Mieszkania
                </legend>
                {apartments.length ? (
                  <div className="grid max-h-52 gap-2 overflow-y-auto rounded-md border border-[#dfe5ed] p-2 min-[420px]:grid-cols-2 min-[680px]:grid-cols-3">
                    {apartments.map(({ id, number }, index) => (
                      <label
                        key={id}
                        className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-[#526077] hover:bg-[#f6f8fb] has-checked:bg-[#f6f9ff] has-checked:text-[#1456a8] has-focus-visible:outline-2 has-focus-visible:outline-[#70a8fa]"
                      >
                        <input
                          type="checkbox"
                          name={apartmentField.name}
                          ref={index === 0 ? apartmentField.ref : undefined}
                          checked={apartmentField.value.includes(id)}
                          onBlur={apartmentField.onBlur}
                          onChange={(event) =>
                            apartmentField.onChange(
                              event.target.checked
                                ? [...apartmentField.value, id]
                                : apartmentField.value.filter(
                                    (value) => value !== id,
                                  ),
                            )
                          }
                          className="size-4 shrink-0 accent-[#0866f5]"
                        />
                        <span className="min-w-0 wrap-break-word">
                          Mieszkanie {number}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-[#dfe5ed] bg-[#f7f8fa] px-3 py-2.5 text-sm text-[#66758a]">
                    {selectedBuilding
                      ? 'Brak mieszkań w budynku.'
                      : 'Najpierw wybierz budynek.'}
                  </p>
                )}
                <FieldError
                  id={id + '-apartments-error'}
                  message={errors.apartmentIds?.message}
                />
              </fieldset>
            )}

            <div className="grid gap-4 min-[560px]:grid-cols-2">
              <InspectionField
                id={id + '-technician'}
                label="Technik (opcjonalnie)"
                error={errors.technicianId?.message}
              >
                <InspectionSelect
                  id={id + '-technician'}
                  aria-invalid={!!errors.technicianId}
                  aria-describedby={
                    errors.technicianId ? id + '-technician-error' : undefined
                  }
                  disabled={usersLoading || !!usersError || !technicians.length}
                  {...register('technicianId')}
                >
                  <option value="">
                    {usersLoading
                      ? 'Ładowanie techników…'
                      : usersError
                        ? 'Nie udało się pobrać techników'
                        : technicians.length
                          ? 'Bez przypisania'
                          : 'Brak techników do wyboru'}
                  </option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </InspectionSelect>
                {!!usersError && (
                  <p className="text-xs text-[#a03830]">
                    {getApiErrorMessage(usersError)}{' '}
                    <button
                      type="button"
                      disabled={usersFetching}
                      onClick={onRetryUsers}
                      className="font-medium text-[#0866f5] underline underline-offset-2 disabled:opacity-50"
                    >
                      Spróbuj ponownie
                    </button>
                  </p>
                )}
              </InspectionField>
            </div>

            {errors.root?.server?.message && (
              <div
                role="alert"
                className="rounded-md border border-[#f0d2ce] bg-[#fff6f4] px-3 py-2.5 text-sm leading-relaxed text-[#a03830]"
              >
                {errors.root.server.message}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-[#edf0f5] pt-4">
              <button
                type="submit"
                disabled={isSending || !buildings.length || !!buildingsError}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0866f5] px-4 py-2.5 text-sm font-medium text-white enabled:hover:bg-[#0057dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-safe:active:not-focus-visible:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    Zapisywanie…
                  </>
                ) : (
                  <>
                    Zaplanuj przegląd
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  reset(defaultValues);
                  setConfirmation(null);
                  clearErrors('root.server');
                }}
                className="rounded-md border border-[#dfe5ed] px-4 py-2.5 text-sm font-medium text-[#526077] hover:bg-[#f6f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-safe:active:not-focus-visible:scale-[0.98]"
              >
                Wyczyść formularz
              </button>
            </div>
          </fieldset>

          {confirmation && (
            <div
              ref={confirmationRef}
              role="status"
              tabIndex={-1}
              className="space-y-1 rounded-lg border border-[#dce8fc] bg-[#f6f9ff] p-4 text-sm text-[#344054] outline-none"
            >
              <h3 className="font-semibold">
                {confirmation.count > 1
                  ? `Zaplanowano przeglądy (${confirmation.count})`
                  : 'Przegląd został zaplanowany'}
              </h3>
              <p>{confirmation.typeLabel}</p>
              <p>{confirmation.location}</p>
              {confirmation.technicianName && (
                <p>Technik: {confirmation.technicianName}</p>
              )}
              <p>
                <time dateTime={confirmation.scheduledAt}>
                  {dateFormatter.format(new Date(confirmation.scheduledAt))}
                </time>
              </p>
            </div>
          )}
        </form>
      </section>

      <aside className={sectionClassName} aria-labelledby={id + '-audience'}>
        <h2 id={id + '-audience'} className={sectionHeadingClassName}>
          <UsersRound
            size={20}
            strokeWidth={1.7}
            className="shrink-0 text-[#0866f5]"
            aria-hidden="true"
          />
          Odbiorcy przeglądu
        </h2>
        <div className="space-y-4 p-6 text-sm leading-relaxed max-[560px]:p-4">
          {selectedBuilding && (
            <div className="flex items-start gap-3 rounded-lg border border-[#e5eaf1] bg-[#f8fafc] p-3">
              <Building2
                size={18}
                strokeWidth={1.7}
                className="mt-0.5 shrink-0 text-[#0866f5]"
                aria-hidden="true"
              />
              <div className="min-w-0 wrap-break-word">
                <p className="font-medium text-[#263448]">
                  {selectedBuilding.name}
                </p>
                <p className="text-[#526077]">{selectedBuilding.address}</p>
              </div>
            </div>
          )}

          <p aria-live="polite" className="text-[#526077]">
            {!selectedBuilding
              ? 'Wybierz budynek, żeby zobaczyć odbiorców przeglądu.'
              : scope === 'building'
                ? 'Przegląd dotyczy wszystkich mieszkańców tego budynku.'
                : selectedApartments.length
                  ? 'Przegląd dotyczy osób z poniższych mieszkań.'
                  : 'Zaznacz mieszkania, których dotyczy przegląd.'}
          </p>

          {scope === 'apartment' && selectedApartments.length > 0 && (
            <ul
              aria-label="Wybrane mieszkania"
              className="flex flex-wrap gap-2"
            >
              {selectedApartments.map(({ id, number }) => (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#e5eaf1] px-2.5 py-1 text-[#344054]"
                >
                  <House size={14} strokeWidth={1.7} aria-hidden="true" />
                  Mieszkanie {number}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
