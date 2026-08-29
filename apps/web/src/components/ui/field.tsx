import type { InputHTMLAttributes } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, id, ...input }: FieldProps) {
  const fieldId = id ?? input.name;
  const messageId = `${fieldId}-message`;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        aria-describedby={hint || error ? messageId : undefined}
        aria-invalid={Boolean(error)}
        {...input}
      />
      {(error || hint) && <small id={messageId}>{error ?? hint}</small>}
    </div>
  );
}
