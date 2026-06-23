export function LoadingState({
  title = "Memuat data...",
  description = "Mohon tunggu sebentar, data sedang disiapkan."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/75 p-8 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--surface-strong)] border-t-[var(--accent)]" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}
