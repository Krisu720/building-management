'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { FieldError } from '@/components/ui/field-error';
import { getApiErrorMessage } from '@/lib/api/fetch';
import {
  getApartmentsFindAllQueryKey,
  getBuildingsFindAllQueryKey,
  getBuildingsFindAllWithApartmentsQueryKey,
  useBuildingsCreate,
} from '@/lib/api/generated';
import type { BuildingWithApartments } from '@/lib/api/models';

const apartmentNumberSchema = z
  .string()
  .trim()
  .min(1, 'Wpisz numer mieszkania.')
  .max(50, 'Numer mieszkania może mieć maksymalnie 50 znaków.');

const buildingFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Wpisz nazwę budynku.')
    .max(200, 'Nazwa może mieć maksymalnie 200 znaków.'),
  address: z
    .string()
    .trim()
    .min(1, 'Wpisz adres budynku.')
    .max(500, 'Adres może mieć maksymalnie 500 znaków.'),
  apartmentNumber: z.string(),
  apartments: z.array(z.object({ number: apartmentNumberSchema })),
});

type BuildingDraft = z.infer<typeof buildingFormSchema>;

const inputClassName =
  'h-10 w-full min-w-0 rounded-md border border-[#dfe5ed] bg-white px-3 text-sm text-[#344054] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#70a8fa] aria-invalid:border-[#d56a61] disabled:bg-[#f8fafc] disabled:opacity-60 max-[560px]:text-base';
const labelClassName = 'block text-sm font-medium text-[#344054]';
const secondaryButtonClassName =
  'inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dfe5ed] px-3 text-sm font-medium text-[#526077] enabled:hover:bg-[#f6f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] disabled:cursor-not-allowed disabled:opacity-50';

export function BuildingForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const fieldId = useId();
  const queryClient = useQueryClient();
  const createBuilding = useBuildingsCreate();
  const submissionInFlight = useRef(false);
  const {
    register,
    control,
    setFocus,
    getValues,
    resetField,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BuildingDraft>({
    defaultValues: {
      name: '',
      address: '',
      apartmentNumber: '',
      apartments: [],
    },
    resolver: standardSchemaResolver(buildingFormSchema),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'apartments',
  });

  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  const isSending = isSubmitting || createBuilding.isPending;
  const nameId = fieldId + '-name';
  const addressId = fieldId + '-address';
  const numberId = fieldId + '-apartment-number';
  const nameError = errors.name?.message;
  const addressError = errors.address?.message;
  const numberError = errors.apartmentNumber?.message;

  function confirmApartment() {
    const confirmedNumbers = new Set(
      fields.map(({ number }) => number.toLocaleLowerCase('pl-PL')),
    );
    const parsed = apartmentNumberSchema
      .refine(
        (number) => !confirmedNumbers.has(number.toLocaleLowerCase('pl-PL')),
        {
          error: 'Ten numer już jest na liście.',
        },
      )
      .safeParse(getValues('apartmentNumber'));

    if (!parsed.success) {
      setError(
        'apartmentNumber',
        { message: parsed.error.issues[0]?.message },
        { shouldFocus: true },
      );
      return;
    }

    append({ number: parsed.data }, { shouldFocus: false });
    resetField('apartmentNumber');
    setFocus('apartmentNumber');
  }

  async function submitBuilding(values: BuildingDraft) {
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    clearErrors('root.server');
    try {
      const apartments = values.apartments.map(({ number }) => number);
      const created = await createBuilding.mutateAsync({
        data: {
          name: values.name,
          address: values.address,
          ...(apartments.length > 0 ? { apartments } : {}),
        },
      });

      queryClient.setQueryData<BuildingWithApartments[]>(
        getBuildingsFindAllWithApartmentsQueryKey(),
        (current) =>
          current
            ? [...current, created].sort((a, b) =>
                a.name.localeCompare(b.name, 'pl'),
              )
            : undefined,
      );
      void queryClient.invalidateQueries({
        queryKey: getBuildingsFindAllWithApartmentsQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: getBuildingsFindAllQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: getApartmentsFindAllQueryKey(),
      });
      onClose();
    } catch (error) {
      setError('root.server', { message: getApiErrorMessage(error) });
    } finally {
      submissionInFlight.current = false;
    }
  }

  return (
    <section
      id={id}
      aria-labelledby={fieldId + '-heading'}
      className="mb-6 overflow-hidden rounded-xl border border-[#e5eaf1] bg-white"
    >
      <h2
        id={fieldId + '-heading'}
        className="border-b border-[#edf0f5] px-6 py-4 text-[17px] font-semibold text-[#263448] max-[560px]:px-4"
      >
        Nowy budynek
      </h2>
      <form
        noValidate
        onSubmit={handleSubmit(submitBuilding)}
        onChange={() => clearErrors('root.server')}
        aria-busy={isSending}
        className="space-y-5 p-6 max-[560px]:p-4"
      >
        <fieldset disabled={isSending} className="space-y-5">
          <div className="grid gap-4 min-[560px]:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={nameId} className={labelClassName}>
                Nazwa budynku
              </label>
              <input
                id={nameId}
                className={inputClassName}
                maxLength={200}
                required
                aria-invalid={!!nameError}
                aria-describedby={nameError ? nameId + '-error' : undefined}
                {...register('name')}
              />
              <FieldError id={nameId + '-error'} message={nameError} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={addressId} className={labelClassName}>
                Adres
              </label>
              <input
                id={addressId}
                className={inputClassName}
                maxLength={500}
                required
                aria-invalid={!!addressError}
                aria-describedby={
                  addressError ? addressId + '-error' : undefined
                }
                {...register('address')}
              />
              <FieldError id={addressId + '-error'} message={addressError} />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className={labelClassName}>Mieszkania (opcjonalnie)</legend>
            <div className="max-w-sm space-y-1.5">
              <label htmlFor={numberId} className="text-sm text-[#526077]">
                Numer mieszkania
              </label>
              <div className="flex gap-2">
                <input
                  id={numberId}
                  className={inputClassName}
                  placeholder="Np. 50A"
                  maxLength={50}
                  aria-invalid={!!numberError}
                  aria-describedby={
                    numberError ? numberId + '-error' : undefined
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      confirmApartment();
                    }
                  }}
                  {...register('apartmentNumber')}
                />
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={confirmApartment}
                >
                  <Check size={16} aria-hidden="true" />
                  Zatwierdź
                </button>
              </div>
              <FieldError id={numberId + '-error'} message={numberError} />
            </div>

            {fields.length > 0 && (
              <ul
                aria-label="Zatwierdzone mieszkania"
                className="flex flex-wrap gap-2"
              >
                {fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="inline-flex min-w-0 items-center gap-2 rounded-md border border-[#e5eaf1] bg-[#f8fafc] py-1 pl-3 pr-1 text-sm text-[#344054]"
                  >
                    <span className="min-w-0 wrap-break-word">
                      Mieszkanie {field.number}
                    </span>
                    <button
                      type="button"
                      aria-label={'Usuń mieszkanie ' + field.number}
                      className="grid size-8 shrink-0 place-items-center rounded text-[#526077] enabled:hover:bg-white focus-visible:outline-2 focus-visible:outline-[#6ea8ff] disabled:opacity-50"
                      onClick={() => {
                        remove(index);
                        setFocus('apartmentNumber');
                      }}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {errors.root?.server?.message && (
            <div
              role="alert"
              className="rounded-md border border-[#f0d2ce] bg-[#fff6f4] px-3 py-2.5 text-sm leading-relaxed text-[#a03830]"
            >
              {errors.root.server.message}
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-[#edf0f5] pt-4">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#0866f5] px-4 text-sm font-medium text-white enabled:hover:bg-[#0057dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-safe:active:not-focus-visible:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                'Dodaj budynek'
              )}
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={onClose}
            >
              Anuluj
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
