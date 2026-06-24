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
    <SectionCard className="border-[#cfead4] bg-[linear-gradient(180deg,#f3fbf5,#edf9f0)] px-4 py-3 shadow-none">
      <p className="text-sm font-semibold text-[#1f6b2b]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[#327c3e]">{description}</p>
      ) : null}
    </SectionCard>
  );
}
