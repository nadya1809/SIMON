"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ModuleFiltersProps = {
  children: ReactNode;
  className?: string;
};

type FilterFieldsProps = {
  children: ReactNode;
  columnsClassName?: string;
  className?: string;
};

type FilterActionsProps = {
  children: ReactNode;
  className?: string;
};

type FilterSearchFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
};

type FilterSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  hint?: string;
  disabled?: boolean;
};

type FilterResetButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
};

type FilterResetLinkProps = {
  href: string;
  disabled?: boolean;
  children?: ReactNode;
};

type FilterAutoApplyStatusProps = {
  isPending?: boolean;
  pendingLabel?: string;
  idleLabel?: string;
  className?: string;
};

export function ModuleFilters({ children, className }: ModuleFiltersProps) {
  return <FilterToolbar className={className}>{children}</FilterToolbar>;
}

export function FilterFields({
  children,
  columnsClassName = "md:grid-cols-2 xl:grid-cols-4",
  className
}: FilterFieldsProps) {
  return (
    <div className={cn("grid min-w-0 flex-1 gap-4", columnsClassName, className)}>
      {children}
    </div>
  );
}

export function FilterActions({ children, className }: FilterActionsProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto xl:min-w-fit [&_button]:w-full sm:[&_button]:w-auto", className)}>
      {children}
    </div>
  );
}

export function FilterSearchField({
  label = "Cari data",
  value,
  onChange,
  placeholder = "Cari data",
  hint
}: FilterSearchFieldProps) {
  return (
    <FormField label={label} hint={hint}>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </FormField>
  );
}

export function FilterSelectField({
  label,
  value,
  onChange,
  children,
  hint,
  disabled
}: FilterSelectFieldProps) {
  return (
    <FormField label={label} hint={hint}>
      <Select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </Select>
    </FormField>
  );
}

export function FilterAutoApplyStatus({
  isPending = false,
  pendingLabel = "Memuat filter...",
  idleLabel = "Filter diterapkan otomatis",
  className
}: FilterAutoApplyStatusProps) {
  return (
    <div className={cn("flex h-11 items-center gap-2 text-sm text-[var(--muted)]", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full transition",
          isPending ? "animate-pulse bg-[var(--accent)]" : "bg-[var(--success-fg)]"
        )}
      />
      {isPending ? pendingLabel : idleLabel}
    </div>
  );
}

export function FilterResetLink({
  href,
  disabled = false,
  children = "Reset"
}: FilterResetLinkProps) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--surface)] sm:w-auto",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <FontAwesomeIcon icon={faRotateLeft} className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function FilterResetButton({
  onClick,
  disabled,
  children = "Reset Filter"
}: FilterResetButtonProps) {
  return (
    <Button variant="secondary" icon={faRotateLeft} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
