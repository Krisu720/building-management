'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FileImage, UploadCloud, X } from 'lucide-react';
import { FieldError } from '@/components/ui/field-error';
import { cn } from '@/lib/utils';
import {
  issueFormLimits,
  issuePhotoMimeTypes,
  issuePhotosSchema,
} from './issue-form-schema';

function fileKey(file: File) {
  return [file.name, file.size, file.lastModified].join(':');
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (
    (bytes / 1024 / 1024).toLocaleString('pl-PL', {
      maximumFractionDigits: 2,
    }) + ' MB'
  );
}

function AttachmentThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url && !failed ? (
    <img
      src={url}
      alt=""
      className="size-11 shrink-0 rounded-md object-cover"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-[#f5f7fa] text-[#8794a6]">
      <FileImage size={19} aria-hidden="true" />
    </span>
  );
}

export function RequestAttachments({
  files,
  onChange,
  validationError,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  validationError?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectionError, setError] = useState('');
  const error = selectionError || validationError;

  function addFiles(selected: File[]) {
    if (disabled || !selected.length) return;
    const existingKeys = new Set(files.map(fileKey));
    const added = selected.filter((file) => {
      const key = fileKey(file);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    const result = issuePhotosSchema.safeParse([...files, ...added]);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Nieprawidłowe zdjęcia.');
      return;
    }
    setError('');
    onChange(result.data);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span
          id={id + '-label'}
          className="text-[13px] font-medium text-[#344054]"
        >
          Zdjęcia{' '}
          <span className="font-normal text-[#8792a2]">(opcjonalnie)</span>
        </span>
        <span
          className="text-[12px] tabular-nums text-[#8792a2]"
          aria-live="polite"
        >
          {files.length} / {issueFormLimits.photos}
        </span>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={issuePhotoMimeTypes.join(',')}
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <div
        className={cn(
          'rounded-lg border border-dashed border-[#cfd9e7] bg-[#fcfdff] transition-colors duration-150',
          dragging && 'border-[#0866f5] bg-[#f1f6ff]',
          disabled && 'opacity-60',
          error && 'border-[#d56a61]',
        )}
        onDragOver={(event) => {
          if (disabled || !event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setDragging(true);
        }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;
          if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
          ) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <button
          type="button"
          disabled={disabled}
          className="disabled:cursor-not-allowed flex min-h-[104px] w-full flex-col items-center justify-center gap-2 rounded-lg px-4 py-3 text-center outline-none hover:bg-[#f6f9fe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff] motion-reduce:transition-none"
          aria-labelledby={id + '-label ' + id + '-action'}
          aria-describedby={id + '-hint' + (error ? ' ' + id + '-error' : '')}
          aria-invalid={!!error}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud
            size={25}
            strokeWidth={1.5}
            className="text-[#0866f5]"
            aria-hidden="true"
          />
          <span
            id={id + '-action'}
            className="text-[13px] font-medium text-[#344054]"
          >
            <span className="text-[#0866f5]">Wybierz zdjęcia</span> lub
            przeciągnij je tutaj
          </span>
          <span
            id={id + '-hint'}
            className="text-[11px] leading-relaxed text-[#8792a2]"
          >
            Do 5 zdjęć, łącznie do 10 MB. JPG, PNG, WEBP.
          </span>
        </button>
      </div>
      <FieldError id={id + '-error'} message={error} />
      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Dodane zdjęcia">
          {files.map((file) => (
            <li
              key={fileKey(file)}
              className="flex items-center gap-3 rounded-lg border border-[#e8edf3] p-2"
            >
              <AttachmentThumbnail file={file} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-[#40506a]">
                  {file.name}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8792a2]">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                aria-label={'Usuń zdjęcie ' + file.name}
                className="grid size-8 shrink-0 place-items-center rounded-md text-[#8792a2] hover:bg-[#f4f6f9] hover:text-[#b42318] focus-visible:outline-2 focus-visible:outline-[#6ea8ff]"
                onClick={() => {
                  setError('');
                  onChange(files.filter((item) => item !== file));
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
