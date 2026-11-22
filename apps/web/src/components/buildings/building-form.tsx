'use client';

import { Check, X } from 'lucide-react';
import { useEffect, useId } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { FieldError } from '@/components/ui/field-error';

const apartmentNumberSchema = z
  .string()
  .trim()
  .min(1, 'Wpisz numer mieszkania.');

type BuildingDraft = {
  name: string;
  address: string;
  apartmentNumber: string;
  apartments: { number: string }[];
};

const inputClassName =
  'h-10 w-full min-w-0 rounded-md border border-[#dfe5ed] bg-white px-3 text-sm text-[#344054] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#70a8fa] aria-invalid:border-[#d56a61] max-[560px]:text-base';
const labelClassName = 'block text-sm font-medium text-[#344054]';
const secondaryButtonClassName =
  'inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dfe5ed] px-3 text-sm font-medium text-[#526077] hover:bg-[#f6f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff]';

export function BuildingForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const fieldId = useId();
  const {
    register,
    control,
    setFocus,
    getValues,
    resetField,
    setError,
    formState: { errors },
  } = useForm<BuildingDraft>({
    defaultValues: {
      name: '',
      address: '',
      apartmentNumber: '',
      apartments: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'apartments',
  });

  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  const numberId = fieldId + '-apartment-number';
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
        onSubmit={(event) => event.preventDefault()}
        className="space-y-5 p-6 max-[560px]:p-4"
      >
        <div className="grid gap-4 min-[560px]:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId + '-name'} className={labelClassName}>
              Nazwa budynku
            </label>
            <input
              id={fieldId + '-name'}
              className={inputClassName}
              maxLength={200}
              required
              {...register('name')}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId + '-address'} className={labelClassName}>
              Adres
            </label>
            <input
              id={fieldId + '-address'}
              className={inputClassName}
              maxLength={500}
              required
              {...register('address')}
            />
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
                aria-invalid={!!numberError}
                aria-describedby={numberError ? numberId + '-error' : undefined}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
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
                    className="grid size-8 shrink-0 place-items-center rounded text-[#526077] hover:bg-white focus-visible:outline-2 focus-visible:outline-[#6ea8ff]"
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

        <div className="flex flex-wrap gap-3 border-t border-[#edf0f5] pt-4">
          <button
            type="submit"
            disabled
            className="min-h-10 rounded-md bg-[#0866f5] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dodaj budynek
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Anuluj
          </button>
        </div>
      </form>
    </section>
  );
}
