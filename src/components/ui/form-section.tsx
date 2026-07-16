import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-[0.01em] text-[var(--foreground)]">
          {title}
        </h4>
        {description ? (
          <p className="text-xs leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
