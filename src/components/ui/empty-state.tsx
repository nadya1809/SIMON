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
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--accent-soft),#f0f8fe)] text-[var(--accent)]">
        {mappedIcon ? (
          <FontAwesomeIcon icon={mappedIcon} className="h-6 w-6" />
        ) : (
          icon ?? "∅"
        )}
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
