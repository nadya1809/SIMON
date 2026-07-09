import { ReactNode } from "react";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";

type BooleanStatusFieldProps = {
  label: string;
  value: boolean;
  onToggle: () => void;
  enabledText: string;
  disabledText: string;
  enabledLabel?: string;
  disabledLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
};

export function BooleanStatusField({
  label,
  value,
  onToggle,
  enabledText,
  disabledText,
  enabledLabel = "Aktif",
  disabledLabel = "Nonaktif",
  disabled = false,
  children
}: BooleanStatusFieldProps) {
  return (
    <FormField label={label}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm shadow-[var(--shadow-sm)] disabled:opacity-60"
      >
        <span>{value ? enabledText : disabledText}</span>
        <Badge variant={value ? "success" : "warning"}>
          {value ? enabledLabel : disabledLabel}
        </Badge>
      </button>
      {children}
    </FormField>
  );
}
