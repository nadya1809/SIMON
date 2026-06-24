import { LoadingState } from "@/components/ui/loading-state";

export default function DashboardLoading() {
  return (
    <LoadingState
      title="Memuat halaman dashboard..."
      description="Data dan komponen antarmuka sedang disiapkan."
    />
  );
}
