import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = "Terjadi kendala saat memuat data",
  description = "Silakan coba lagi. Jika masalah terus muncul, periksa konfigurasi atau koneksi sistem.",
  actionLabel,
  onAction
}: ErrorStateProps) {
  return (
    <SectionCard className="border-[color:var(--danger-bg)] bg-[linear-gradient(180deg,var(--danger-bg),var(--card))] p-8 text-center shadow-none">
      <h3 className="text-lg font-bold text-[var(--danger-fg)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--danger-fg)]">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button variant="danger" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
}
