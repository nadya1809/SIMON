import { ReactNode } from "react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { cn } from "@/lib/utils";
import { accentEyebrowClassName } from "@/components/ui/primitive-styles";

type AccentSummaryPanelProps = {
  eyebrow: string;
  title?: string;
  description?: string;
  meta?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AccentSummaryPanel({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children,
  className,
  contentClassName
}: AccentSummaryPanelProps) {
  return (
    <AccentPanel className={cn("p-5", className)}>
      <p className={accentEyebrowClassName}>{eyebrow}</p>
      <div
        className={cn(
          "mt-3 grid gap-4 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] md:items-end",
          contentClassName
        )}
      >
        <div className="space-y-3">
          {title ? <p className="text-2xl font-bold">{title}</p> : null}
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-white/80">{description}</p>
          ) : null}
          {meta ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {meta}
            </p>
          ) : null}
          {children}
        </div>

        {actions ? <div className="flex md:justify-end">{actions}</div> : null}
      </div>
    </AccentPanel>
  );
}
