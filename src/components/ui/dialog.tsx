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
        "rounded-3xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,254,0.96))] p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 space-y-1 border-b border-[var(--border)] pb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? (
          <p className="text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
