import { cn } from "@/lib/utils";

type EntityIdentityCellProps = {
  name: string;
  subtitle?: string;
  helperText?: string;
  className?: string;
};

export function EntityIdentityCell({
  name,
  subtitle,
  helperText,
  className
}: EntityIdentityCellProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="font-semibold">{name}</p>
      {subtitle ? (
        <p className="text-xs text-[var(--muted)]">{subtitle}</p>
      ) : null}
      {helperText ? (
        <p className="text-xs text-[var(--muted)]">{helperText}</p>
      ) : null}
    </div>
  );
}
