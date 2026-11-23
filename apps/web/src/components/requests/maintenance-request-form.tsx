'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useController, useForm, useWatch } from 'react-hook-form';
import {
  ArrowRight,
  LoaderCircle,
  Building2,
  Bell,
  Clock3,
  ChevronDown,
  Check,
  Phone,
  Mail,
  FileText,
  House,
  Info,
  MapPin,
  Wrench,
} from 'lucide-react';
import { FieldError } from '@/components/ui/field-error';
import { RequestAttachments } from './request-attachments';
import { createIssuePayload } from './issue-payload';
import {
  getApartmentsFindAllQueryKey,
  getIssuesFindAllQueryKey,
  getIssuesFindMineQueryKey,
  useApartmentsFindAll,
  useBuildingsFindAll,
  useIssuesCreate,
} from '@/lib/api/generated';
import type { Apartment, Issue } from '@/lib/api/models';
import { getApiErrorMessage } from '@/lib/api/fetch';
import { formatIssueNumber } from '@/lib/issue-number';
import { useQueryClient } from '@tanstack/react-query';
import {
  createIssueFormSchema,
  getIssueDescription,
  issueFormLimits,
  type IssueBuilding,
  type IssueApartment,
  type IssueFormInput,
  type IssueFormValues,
} from './issue-form-schema';

type IssueConfirmation = {
  issue: Issue;
  buildingLabel: string;
  apartmentLabel: string | null;
};

const defaultValues: IssueFormInput = {
  scope: 'apartment',
  title: '',
  buildingId: '',
  apartmentId: '',
  commonLocation: '',
  description: '',
  photos: [],
};

const emptyBuildings: readonly IssueBuilding[] = [];
const emptyApartments: readonly IssueApartment[] = [];

const inputClassName =
  'h-[40px] w-full min-w-0 rounded-md border border-[#dfe5ed] bg-white px-3 text-[14px] text-[#344054] shadow-[0_1px_2px_#10274303] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#9aa5b4] focus:border-[#70a8fa] focus:shadow-[0_0_0_3px_#0866f510] aria-invalid:border-[#d56a61] aria-invalid:focus:shadow-[0_0_0_3px_#d56a611a] max-[560px]:h-11 max-[560px]:text-base';
const selectClassName =
  inputClassName +
  ' appearance-none pl-9 pr-8 disabled:cursor-not-allowed disabled:bg-[#f7f8fa] disabled:text-[#8792a2]';
const labelClassName = 'mb-1.5 block text-[14px] font-medium text-[#344054]';
const cardClassName = 'min-w-0 rounded-xl border border-[#e5eaf1] bg-white';
const pressClassName =
  'transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:not-focus-visible:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-reduce:transform-none motion-reduce:transition-none';

function RequiredMark() {
  return (
    <span className="ml-1 text-[#d04444]" aria-hidden="true">
      *
    </span>
  );
}

function RequestGuidance() {
  return (
    <aside
      className="flex flex-col gap-3 min-[1151px]:[&>section:last-child]:flex-1"
      aria-label="Informacje o zgłoszeniu"
    >
      <section className={cardClassName + ' p-5'}>
        <h2 className="flex items-center gap-3 text-[15px] font-semibold tracking-[-0.3px] text-[#263448]">
          <Info
            size={20}
            className="shrink-0 text-[#0866f5]"
            aria-hidden="true"
          />
          Co warto zawrzeć w zgłoszeniu?
        </h2>
        <ul className="mt-4 space-y-3">
          {[
            'Napisz, co nie działa i w którym miejscu.',
            'Podaj, od kiedy występuje problem i czy się powtarza.',
            'Opisz, czy usterka utrudnia korzystanie z mieszkania lub budynku.',
            'Przed wysłaniem sprawdź adres i numer mieszkania.',
          ].map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-3 text-[12px] leading-[1.65] text-[#66758a]"
            >
              <Check
                size={15}
                className="mt-0.5 shrink-0 text-[#0866f5]"
                aria-hidden="true"
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClassName + ' p-5'}>
        <h2 className="flex items-center gap-3 text-[16px] font-semibold tracking-[-0.3px] text-[#263448]">
          <FileText
            size={22}
            strokeWidth={1.7}
            className="shrink-0 text-[#16805b]"
            aria-hidden="true"
          />
          Podsumowanie zgłoszenia
        </h2>
        <p className="mt-4 text-[13px] leading-[1.65] text-[#526077]">
          Po wysłaniu zgłoszenia otrzymasz potwierdzenie oraz numer zgłoszenia.
          Zachowaj go na potrzeby kontaktu z administracją.
        </p>
        <dl className="mt-4 divide-y divide-[#e5eaf1] border-y border-[#e5eaf1] text-[12px]">
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-3 text-[#526077]">
              <Clock3
                size={17}
                className="shrink-0 text-[#718096]"
                aria-hidden="true"
              />{' '}
              Średni czas reakcji
            </dt>
            <dd className="shrink-0 font-semibold text-[#0866f5]">do 1 dnia</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-3 text-[#526077]">
              <Wrench
                size={17}
                className="shrink-0 text-[#718096]"
                aria-hidden="true"
              />{' '}
              Średni czas realizacji
            </dt>
            <dd className="shrink-0 font-semibold text-[#0866f5]">
              2–5 dni roboczych
            </dd>
          </div>
        </dl>
      </section>
      <section className={cardClassName + ' flex flex-col p-5'}>
        <h2 className="flex items-center gap-3 text-[16px] font-semibold tracking-[-0.3px] text-[#263448]">
          <Bell
            size={22}
            strokeWidth={1.7}
            className="shrink-0 text-[#ef4444]"
            aria-hidden="true"
          />
          Sprawy pilne
        </h2>
        <p className="mt-4 text-[13px] leading-[1.65] text-[#526077]">
          Jeśli awaria wymaga natychmiastowej reakcji, skontaktuj się
          telefonicznie z administracją budynku.
        </p>
        <div className="mt-4 flex items-center gap-4 border-t border-[#e5eaf1] pt-4">
          <Phone
            size={21}
            strokeWidth={1.7}
            className="shrink-0 text-[#0866f5]"
            aria-hidden="true"
          />
          <p className="text-[17px] font-semibold tracking-[-0.3px] text-[#263448]">
            +48 000 123 456
          </p>
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-[#e5eaf1] pt-4 min-[1151px]:mt-auto">
          <Mail
            size={20}
            strokeWidth={1.7}
            className="shrink-0 text-[#0866f5]"
            aria-hidden="true"
          />
          <p className="min-w-0 break-all text-[13px] font-medium text-[#526077]">
            administracja@gmail.com
          </p>
        </div>
      </section>
    </aside>
  );
}

export function MaintenanceRequestForm() {
  const queryClient = useQueryClient();
  const buildingsQuery = useBuildingsFindAll();
  const buildings = buildingsQuery.data ?? emptyBuildings;
  const createIssue = useIssuesCreate();
  const submissionInFlight = useRef(false);
  const id = useId();
  const confirmationRef = useRef<HTMLDivElement>(null);
  const [attachmentVersion, setAttachmentVersion] = useState(0);
  const [confirmation, setConfirmation] = useState<IssueConfirmation | null>(
    null,
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    resetField,
    setFocus,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormInput, unknown, IssueFormValues>({
    resolver: (values, context, options) =>
      standardSchemaResolver(
        createIssueFormSchema(
          buildings,
          queryClient.getQueryData<Apartment[]>(
            getApartmentsFindAllQueryKey({ buildingId: values.buildingId }),
          ) ?? emptyApartments,
        ),
      )(values, context, options),
    defaultValues,
    shouldUnregister: true,
  });
  const {
    field: photosField,
    fieldState: { error: photosError },
  } = useController({ control, name: 'photos' });
  const files = photosField.value ?? [];
  const scope = useWatch({ control, name: 'scope' });
  const description = useWatch({ control, name: 'description' }) ?? '';
  const isApartment = scope === 'apartment';
  const buildingId = useWatch({ control, name: 'buildingId' });
  const apartmentsQuery = useApartmentsFindAll(
    { buildingId: buildingId || undefined },
    { query: { enabled: !!buildingId && isApartment } },
  );
  const availableApartments = (apartmentsQuery.data ?? emptyApartments).filter(
    (apartment) => apartment.buildingId === buildingId,
  );
  const commonLocation = useWatch({ control, name: 'commonLocation' }) ?? '';
  const descriptionLimit =
    issueFormLimits.description -
    getIssueDescription({ scope, description: '', commonLocation }).length;
  const isSending = isSubmitting || createIssue.isPending;

  useEffect(() => {
    if (confirmation) confirmationRef.current?.focus();
  }, [confirmation]);

  async function submit(values: IssueFormValues) {
    if (submissionInFlight.current) return;
    const building = buildings.find((item) => item.id === values.buildingId);
    const apartment = availableApartments.find(
      (item) => item.id === values.apartmentId,
    );
    if (!building) {
      setError('buildingId', { message: 'Wybierz budynek z listy.' });
      return;
    }
    submissionInFlight.current = true;
    clearErrors('root.server');
    try {
      const issue = await createIssue.mutateAsync({
        data: createIssuePayload(values),
      });
      void queryClient.invalidateQueries({
        queryKey: getIssuesFindAllQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: getIssuesFindMineQueryKey(),
      });
      setConfirmation({
        issue,
        buildingLabel: building.name + ' — ' + building.address,
        apartmentLabel: apartment?.number ?? null,
      });
      reset(defaultValues);
      setAttachmentVersion((value) => value + 1);
    } catch (error) {
      setError('root.server', { message: getApiErrorMessage(error) });
    } finally {
      submissionInFlight.current = false;
    }
  }

  function startNewRequest() {
    setConfirmation(null);
    createIssue.reset();
    requestAnimationFrame(() => setFocus('title'));
  }

  return (
    <div className="mx-auto max-w-[1360px] px-7 pb-5 pt-7 max-[1100px]:px-8 max-[800px]:px-5 max-[560px]:px-4 max-[560px]:pt-7">
      <header className="mb-5">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-[29px] font-medium leading-[1.3] tracking-[-0.65px] text-[#1c2738] max-[560px]:text-[27px]">
            Zgłoś usterkę
          </h1>
        </div>
        <p className="max-w-[650px] text-[13px] leading-[1.7] text-[#7a8799]">
          Uzupełnij formularz i wyślij zgłoszenie do administracji.
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-stretch gap-5 max-[1150px]:grid-cols-1">
        <section className={cardClassName}>
          <header className="mx-6 flex items-center gap-2.5 border-b border-[#edf0f5] py-3.5 max-[560px]:mx-4">
            <Wrench
              size={20}
              strokeWidth={1.7}
              className="shrink-0 text-[#0866f5]"
              aria-hidden="true"
            />
            <h2 className="text-[16px] font-semibold tracking-[-0.3px] text-[#263448]">
              {confirmation ? 'Zgłoszenie wysłane' : 'Szczegóły zgłoszenia'}
            </h2>
          </header>

          <form
            noValidate
            onSubmit={handleSubmit(submit)}
            onChange={() => clearErrors('root.server')}
            aria-busy={isSending}
            hidden={!!confirmation}
            className="p-[22px] max-[560px]:p-4"
          >
            <fieldset disabled={isSending} className="min-w-0 space-y-4">
              <fieldset>
                <legend className={labelClassName}>
                  Dotyczy
                  <RequiredMark />
                </legend>
                <div className="grid max-w-[380px] grid-cols-2 gap-3">
                  {(
                    [
                      { value: 'apartment', label: 'Mieszkanie', icon: House },
                      {
                        value: 'common',
                        label: 'Część wspólna',
                        icon: Building2,
                      },
                    ] as const
                  ).map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md border border-[#dfe5ed] px-3 py-2 text-[13px] text-[#66758a] has-checked:border-[#0866f5] has-checked:bg-[#f6f9ff] has-checked:text-[#0866f5] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#6ea8ff]"
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register('scope')}
                        className="size-3.5 shrink-0 accent-[#0866f5]"
                      />
                      <Icon
                        size={15}
                        className="hidden min-[450px]:block"
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#8792a2]">
                  Wybierz mieszkanie lub część wspólną, np. klatkę schodową,
                  windę albo garaż.
                </p>
              </fieldset>

              <div>
                <label className={labelClassName} htmlFor={id + '-title'}>
                  Rodzaj usterki
                  <RequiredMark />
                </label>
                <input
                  className={inputClassName}
                  id={id + '-title'}
                  placeholder="Np. Cieknący kran w kuchni"
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={
                    errors.title ? id + '-title-error' : undefined
                  }
                  maxLength={issueFormLimits.title}
                  {...register('title')}
                />
                <FieldError
                  id={id + '-title-error'}
                  message={errors.title?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
                <div className="min-w-0">
                  <label className={labelClassName} htmlFor={id + '-building'}>
                    Budynek
                    <RequiredMark />
                  </label>
                  <div className="relative">
                    <Building2
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8792a2]"
                      aria-hidden="true"
                    />
                    <select
                      className={selectClassName}
                      id={id + '-building'}
                      disabled={
                        buildingsQuery.isLoading ||
                        buildingsQuery.isError ||
                        !buildings.length
                      }
                      aria-required="true"
                      aria-invalid={!!errors.buildingId}
                      aria-describedby={
                        [
                          (!buildings.length || buildingsQuery.isError) &&
                            id + '-building-hint',
                          errors.buildingId && id + '-building-error',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                      {...register('buildingId', {
                        onChange: () => resetField('apartmentId'),
                      })}
                    >
                      <option value="">
                        {buildingsQuery.isLoading
                          ? 'Ładowanie budynków…'
                          : buildingsQuery.isError
                            ? 'Nie udało się pobrać budynków'
                            : buildings.length
                              ? 'Wybierz budynek'
                              : 'Brak dostępnych budynków'}
                      </option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name} — {building.address}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8792a2]"
                      aria-hidden="true"
                    />
                  </div>
                  <FieldError
                    id={id + '-building-error'}
                    message={errors.buildingId?.message}
                  />
                  {(!buildings.length || buildingsQuery.isError) && (
                    <p
                      id={id + '-building-hint'}
                      className="mt-1.5 text-[11px] leading-relaxed text-[#8792a2]"
                    >
                      {buildingsQuery.isError
                        ? getApiErrorMessage(buildingsQuery.error)
                        : buildingsQuery.isLoading
                          ? 'Ładowanie listy budynków…'
                          : 'Nie ma jeszcze budynków do wyboru.'}
                      {buildingsQuery.isError && (
                        <button
                          type="button"
                          disabled={buildingsQuery.isFetching}
                          onClick={() => void buildingsQuery.refetch()}
                          className="ml-2 font-medium text-[#0866f5] underline underline-offset-2 disabled:opacity-50"
                        >
                          Spróbuj ponownie
                        </button>
                      )}
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  <label className={labelClassName} htmlFor={id + '-location'}>
                    {isApartment ? 'Mieszkanie' : 'Miejsce usterki'}
                    <RequiredMark />
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8792a2]"
                      aria-hidden="true"
                    />
                    {isApartment ? (
                      <>
                        <select
                          key="apartment"
                          className={selectClassName}
                          id={id + '-location'}
                          disabled={
                            !buildingId ||
                            apartmentsQuery.isLoading ||
                            apartmentsQuery.isError ||
                            !availableApartments.length
                          }
                          aria-required="true"
                          aria-invalid={!!errors.apartmentId}
                          aria-describedby={
                            [
                              (!buildingId ||
                                apartmentsQuery.isLoading ||
                                apartmentsQuery.isError ||
                                !availableApartments.length) &&
                                id + '-apartment-hint',
                              errors.apartmentId && id + '-location-error',
                            ]
                              .filter(Boolean)
                              .join(' ') || undefined
                          }
                          {...register('apartmentId')}
                        >
                          <option value="">
                            {!buildingId
                              ? 'Najpierw wybierz budynek'
                              : apartmentsQuery.isLoading
                                ? 'Ładowanie mieszkań…'
                                : apartmentsQuery.isError
                                  ? 'Nie udało się pobrać mieszkań'
                                  : availableApartments.length
                                    ? 'Wybierz mieszkanie'
                                    : 'Brak dostępnych mieszkań'}
                          </option>
                          {availableApartments.map((apartment) => (
                            <option key={apartment.id} value={apartment.id}>
                              Mieszkanie {apartment.number}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8792a2]"
                          aria-hidden="true"
                        />
                      </>
                    ) : (
                      <input
                        key="common"
                        className={inputClassName + ' pl-9'}
                        id={id + '-location'}
                        placeholder="Np. klatka B, 2. piętro"
                        aria-required="true"
                        aria-invalid={!!errors.commonLocation}
                        aria-describedby={
                          errors.commonLocation
                            ? id + '-location-error'
                            : undefined
                        }
                        maxLength={issueFormLimits.commonLocation}
                        {...register('commonLocation')}
                      />
                    )}
                  </div>
                  <FieldError
                    id={id + '-location-error'}
                    message={
                      isApartment
                        ? errors.apartmentId?.message
                        : errors.commonLocation?.message
                    }
                  />
                  {isApartment &&
                    (!buildingId ||
                      apartmentsQuery.isLoading ||
                      apartmentsQuery.isError ||
                      !availableApartments.length) && (
                      <p
                        id={id + '-apartment-hint'}
                        className="mt-1.5 text-[11px] leading-relaxed text-[#8792a2]"
                      >
                        {!buildingId
                          ? 'Mieszkania są przypisane do wybranego budynku.'
                          : apartmentsQuery.isError
                            ? getApiErrorMessage(apartmentsQuery.error)
                            : apartmentsQuery.isLoading
                              ? 'Ładowanie listy mieszkań…'
                              : 'W tym budynku nie ma jeszcze mieszkań do wyboru.'}
                        {buildingId && apartmentsQuery.isError && (
                          <button
                            type="button"
                            disabled={apartmentsQuery.isFetching}
                            onClick={() => void apartmentsQuery.refetch()}
                            className="ml-2 font-medium text-[#0866f5] underline underline-offset-2 disabled:opacity-50"
                          >
                            Spróbuj ponownie
                          </button>
                        )}
                      </p>
                    )}
                </div>
              </div>

              <div>
                <label className={labelClassName} htmlFor={id + '-description'}>
                  Opis problemu
                  <RequiredMark />
                </label>
                <div className="relative">
                  <textarea
                    className={
                      inputClassName +
                      ' min-h-[110px] resize-y pb-8 pt-3 leading-[1.7]'
                    }
                    id={id + '-description'}
                    placeholder="Opisz, co nie działa, od kiedy występuje problem i jakie są objawy…"
                    aria-required="true"
                    aria-invalid={!!errors.description}
                    aria-describedby={
                      id +
                      '-description-hint' +
                      (errors.description
                        ? ' ' + id + '-description-error'
                        : '')
                    }
                    maxLength={descriptionLimit}
                    {...register('description')}
                  />
                  <span
                    className="pointer-events-none absolute bottom-2.5 right-3 text-[10px] tabular-nums text-[#8792a2]"
                    aria-hidden="true"
                  >
                    {description.length} / {descriptionLimit}
                  </span>
                </div>
                <FieldError
                  id={id + '-description-error'}
                  message={errors.description?.message}
                />
                <p
                  id={id + '-description-hint'}
                  className="mt-1.5 text-[11px] leading-relaxed text-[#8792a2]"
                >
                  Im więcej szczegółów, tym łatwiej będzie ustalić przyczynę
                  usterki.
                </p>
              </div>

              <RequestAttachments
                files={files}
                onChange={photosField.onChange}
                validationError={photosError?.message}
                disabled={isSending}
                key={attachmentVersion}
              />

              {errors.root?.server?.message && (
                <div
                  role="alert"
                  className="rounded-md border border-[#f0d2ce] bg-[#fff6f4] px-3 py-2.5 text-[13px] leading-relaxed text-[#a03830]"
                >
                  {errors.root.server.message}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 border-t border-[#edf0f5] pt-3.5">
                <button
                  type="submit"
                  disabled={
                    isSending ||
                    buildingsQuery.isError ||
                    !buildings.length ||
                    (isApartment &&
                      (apartmentsQuery.isLoading ||
                        apartmentsQuery.isError ||
                        !availableApartments.length))
                  }
                  className={
                    pressClassName +
                    ' inline-flex h-[40px] items-center justify-center gap-2 rounded-md bg-[#0866f5] px-4 text-[13px] font-medium text-white enabled:hover:bg-[#0057dc] disabled:cursor-not-allowed disabled:opacity-45'
                  }
                >
                  {isSending ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />{' '}
                      Wysyłanie…
                    </>
                  ) : (
                    <>
                      Wyślij zgłoszenie{' '}
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={
                    pressClassName +
                    ' h-[40px] rounded-md border border-[#dfe5ed] px-4 text-[13px] font-medium text-[#66758a] hover:bg-[#f6f8fb]'
                  }
                  onClick={() => {
                    reset(defaultValues);
                    setAttachmentVersion((value) => value + 1);
                  }}
                >
                  Wyczyść formularz
                </button>
              </div>
            </fieldset>
          </form>

          {confirmation && (
            <div
              ref={confirmationRef}
              tabIndex={-1}
              className="p-6 outline-none max-[560px]:p-4"
            >
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-lg border border-[#dce8fc] bg-[#f6f9ff] p-4 text-[13px] leading-relaxed text-[#496382]"
              >
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-[#0866f5]"
                  aria-hidden="true"
                />
                <div>
                  <p>Zgłoszenie zostało zapisane. Numer zgłoszenia:</p>
                  <p className="mt-1 font-mono text-[15px] font-semibold tracking-tight text-[#1c2738] tabular-nums">
                    {formatIssueNumber(confirmation.issue.number)}
                  </p>
                </div>
              </div>
              <h3 className="break-words text-[20px] font-medium leading-snug tracking-[-0.4px] text-[#263448]">
                {confirmation.issue.title}
              </h3>
              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-[13px] max-[560px]:grid-cols-1">
                {[
                  [
                    'Dotyczy',
                    confirmation.issue.apartmentId
                      ? 'Mieszkania'
                      : 'Części wspólnej',
                  ],
                  ['Budynek', confirmation.buildingLabel],
                  ...(confirmation.issue.apartmentId
                    ? [['Numer mieszkania', confirmation.apartmentLabel]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[12px] text-[#8792a2]">{label}</dt>
                    <dd className="mt-1 break-words text-[#40506a]">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="my-6 border-t border-[#edf0f5] pt-3.5">
                <h4 className="text-[12px] text-[#8792a2]">Opis problemu</h4>
                <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-[#40506a]">
                  {confirmation.issue.description}
                </p>
              </div>
              <Link
                href="/my-requests"
                className={
                  pressClassName +
                  ' mr-3 inline-flex h-[40px] items-center gap-2 rounded-md bg-[#0866f5] px-4 text-[13px] font-medium text-white hover:bg-[#0057dc]'
                }
              >
                Moje zgłoszenia <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className={
                  pressClassName +
                  ' mt-7 inline-flex h-[40px] items-center gap-2 rounded-md border border-[#dfe5ed] px-4 text-[13px] font-medium text-[#40506a] hover:bg-[#f6f8fb]'
                }
                onClick={startNewRequest}
              >
                <ArrowRight size={16} aria-hidden="true" /> Wyślij kolejne
                zgłoszenie
              </button>
            </div>
          )}
        </section>
        <RequestGuidance />
      </div>
    </div>
  );
}
