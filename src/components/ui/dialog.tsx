import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Dialog({ title, description, children, className }: DialogProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? (
          <p className="text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
