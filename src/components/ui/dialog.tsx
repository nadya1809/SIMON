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
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,254,0.96))] p-6 shadow-[var(--shadow-md)]",
        className
      )}
    >
      <div className="mb-5 space-y-1 border-b border-[var(--border)] pb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
