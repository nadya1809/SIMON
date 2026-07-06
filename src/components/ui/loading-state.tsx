import { SectionCard } from "@/components/ui/section-card";

export function LoadingState({
  title = "Memuat data...",
  description = "Mohon tunggu sebentar, data sedang disiapkan."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <SectionCard className="overflow-hidden p-0">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),var(--card))] px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-[var(--radius-control)] bg-[var(--accent-soft)]" />
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--accent-soft)]" />
            <div className="h-3 w-48 animate-pulse rounded-full bg-[rgba(51,169,224,0.18)]" />
          </div>
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]/75 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--surface-strong)]" />
            <div className="h-7 w-16 animate-pulse rounded-full bg-[rgba(10,111,182,0.12)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[var(--surface-strong)]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--surface-strong)]" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
