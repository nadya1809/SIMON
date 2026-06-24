import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, hint, error, children }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <div className="space-y-1">
        <span className="text-sm font-semibold tracking-[0.01em] text-[var(--foreground)]">
          {label}
        </span>
        {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-[var(--danger-fg)]">{error}</p> : null}
    </label>
  );
}
