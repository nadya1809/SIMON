import { LoadingState } from "@/components/ui/loading-state";

export default function AuthLoading() {
  return (
    <LoadingState
      title="Menyiapkan halaman login..."
      description="Mohon tunggu sebentar, form autentikasi sedang dimuat."
    />
  );
}
