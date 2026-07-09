import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({
  title = "Memuat data...",
  description = "Mohon tunggu sebentar, data sedang disiapkan."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <SectionCard data-slot="loading-state" className="overflow-hidden p-0">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),var(--card))] px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-11 w-11 bg-[var(--accent-soft)]" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded-full bg-[var(--accent-soft)]" />
            <Skeleton className="h-3 w-48 rounded-full bg-[var(--accent-sky-soft)]" />
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
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full bg-[var(--accent-soft)]" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
