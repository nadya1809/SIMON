import { SectionCard } from "@/components/ui/section-card";

type SuccessFeedbackProps = {
  title: string;
  description?: string;
};

export function SuccessFeedback({
  title,
  description
}: SuccessFeedbackProps) {
  return (
    <SectionCard className="border-[color:var(--success-bg)] bg-[linear-gradient(180deg,var(--success-bg),var(--card))] px-4 py-3 shadow-none">
      <p className="text-sm font-semibold text-[var(--success-fg)]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[var(--success-fg)]">{description}</p>
      ) : null}
    </SectionCard>
  );
}
