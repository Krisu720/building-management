export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="m-0 text-[#b42318] text-[12px] leading-[1.5]" id={id} role="alert">
      {message}
    </p>
  ) : null;
}
