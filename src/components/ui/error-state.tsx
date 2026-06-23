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
    <div className="rounded-3xl border border-[#f4c7c3] bg-[#fff5f4] p-8 text-center">
      <h3 className="text-lg font-bold text-[#8f261c]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#99453d]">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button variant="danger" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
