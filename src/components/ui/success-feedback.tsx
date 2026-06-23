type SuccessFeedbackProps = {
  title: string;
  description?: string;
};

export function SuccessFeedback({
  title,
  description
}: SuccessFeedbackProps) {
  return (
    <div className="rounded-2xl border border-[#cfead4] bg-[#edf9f0] px-4 py-3">
      <p className="text-sm font-semibold text-[#1f6b2b]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[#327c3e]">{description}</p>
      ) : null}
    </div>
  );
}
