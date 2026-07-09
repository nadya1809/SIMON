import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldRootProps = {
  children: ReactNode;
  className?: string;
  invalid?: boolean;
  disabled?: boolean;
};

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FieldRoot({
  children,
  className,
  invalid = false,
  disabled = false
}: FieldRootProps) {
  return (
    <label
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      className={cn("flex flex-col gap-2", className)}
    >
      {children}
    </label>
  );
}

export function FieldHeader({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

export function FieldLabel({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-sm font-semibold tracking-[0.01em] text-[var(--foreground)]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function FieldHint({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("text-xs text-[var(--muted)]", className)}>{children}</p>
  );
}

export function FieldError({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("text-sm text-[var(--danger-fg)]", className)}>{children}</p>
  );
}

export function FieldGroup({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export function FormField({
  label,
  hint,
  error,
  children,
  className
}: FormFieldProps) {
  return (
    <FieldRoot invalid={Boolean(error)} className={className}>
      <FieldHeader>
        <FieldLabel>{label}</FieldLabel>
        {hint ? <FieldHint>{hint}</FieldHint> : null}
      </FieldHeader>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldRoot>
  );
}
