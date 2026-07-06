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

type EmptyStateProps = {
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
    <SectionCard className="border-dashed p-10 text-center">
      <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-[calc(var(--radius-panel)+0.35rem)] bg-[linear-gradient(145deg,var(--accent-soft),var(--card))]" />
        <div className="absolute inset-[0.45rem] rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]/90" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] bg-[linear-gradient(135deg,var(--accent-soft),var(--card))] text-[var(--accent)] shadow-[var(--shadow-sm)]">
          {mappedIcon ? (
            <FontAwesomeIcon icon={mappedIcon} className="h-5 w-5" />
          ) : (
            icon ?? "∅"
          )}
        </div>
      </div>
      <h3 className="text-xl font-bold tracking-[-0.01em]">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </SectionCard>
  );
}
