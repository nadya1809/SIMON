import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faClipboardList,
  faFileCircleXmark,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";

export type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode | string;
};

const defaultIcons: Record<string, typeof faBoxesStacked> = {
  A: faClipboardList,
  RP: faFileCircleXmark,
  U: faBoxesStacked,
  P: faUsers,
  K: faClipboardList,
  PST: faFileCircleXmark
};

export function EmptyStateVisual({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="empty-state-visual"
      className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center"
    >
      <div className="absolute inset-0 rounded-[calc(var(--radius-panel)+0.35rem)] bg-[linear-gradient(145deg,var(--accent-soft),var(--card))]" />
      <div className="absolute inset-[0.45rem] rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]/90" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] bg-[linear-gradient(135deg,var(--accent-soft),var(--card))] text-[var(--accent)] shadow-[var(--shadow-sm)]">
        {children}
      </div>
    </div>
  );
}

export function EmptyStateTitle({ children }: { children: ReactNode }) {
  return (
    <h3 data-slot="empty-state-title" className="text-xl font-bold tracking-[-0.01em]">
      {children}
    </h3>
  );
}

export function EmptyStateDescription({ children }: { children: ReactNode }) {
  return (
    <p
      data-slot="empty-state-description"
      className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]"
    >
      {children}
    </p>
  );
}

export function EmptyStateActions({ children }: { children: ReactNode }) {
  return (
    <div data-slot="empty-state-actions" className="mt-5">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon
}: EmptyStateProps) {
  const mappedIcon =
    typeof icon === "string" ? defaultIcons[icon] ?? faFileCircleXmark : null;

  return (
    <SectionCard data-slot="empty-state" className="border-dashed p-10 text-center">
      <EmptyStateVisual>
          {mappedIcon ? (
            <FontAwesomeIcon icon={mappedIcon} className="h-5 w-5" />
          ) : (
            icon ?? "∅"
          )}
      </EmptyStateVisual>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
      {actionLabel && onAction ? (
        <EmptyStateActions>
          <Button onClick={onAction}>{actionLabel}</Button>
        </EmptyStateActions>
      ) : null}
    </SectionCard>
  );
}
