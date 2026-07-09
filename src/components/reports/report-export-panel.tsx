"use client";

import { useState, useTransition } from "react";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Select } from "@/components/ui/select";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";

type ReportExportPanelProps = {
  from: string;
  to: string;
  unitId: string;
  className?: string;
};

export function ReportExportPanel({
  from,
  to,
  unitId,
  className
}: ReportExportPanelProps) {
  const [format, setFormat] = useState<"pdf" | "xlsx">("xlsx");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleExport() {
    startTransition(async () => {
      const searchParams = new URLSearchParams({
        format,
        from,
        to
      });

      if (unitId) {
        searchParams.set("unitId", unitId);
      }

      const response = await fetch(`/api/reports/export?${searchParams.toString()}`);

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        toast.error(result.message || "Gagal menyiapkan file export.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename =
        filenameMatch?.[1] ??
        `laporan-simon.${format === "xlsx" ? "xlsx" : "pdf"}`;
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success(
        format === "xlsx"
          ? "File Excel berhasil disiapkan dan diunduh."
          : "File PDF berhasil disiapkan dan diunduh."
      );
      setIsDialogOpen(false);
    });
  }

  return (
    <>
      <SectionCard className={cn("p-5 md:p-6", className)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent)]">
                <FontAwesomeIcon icon={faFileArrowDown} className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Aksi Export
                </p>
                <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">
                  Unduh laporan sesuai filter aktif
                </h3>
              </div>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">
              Gunakan panel ini untuk menyiapkan file Excel atau PDF dengan
              struktur data yang sama seperti ringkasan laporan pada dashboard
              SIMON PST.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Format export mengikuti periode dan unit yang sedang dipilih
            </p>
          </div>

          <div className="flex lg:justify-end">
            <Button icon={faFileArrowDown} onClick={() => setIsDialogOpen(true)}>
              Buka Dialog Export
            </Button>
          </div>
        </div>
      </SectionCard>

      <ModalDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Export laporan"
        description="Pilih format file lalu generate laporan sesuai filter aktif."
      >
        <div className="space-y-4">
          <FormSection
            title="Pilih format file"
            description="Gunakan Excel untuk olah data lanjutan atau PDF untuk pelaporan formal."
          >
            <FormField label="Format export">
              <Select
                value={format}
                onChange={(event) => setFormat(event.target.value as "pdf" | "xlsx")}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
              </Select>
            </FormField>
          </FormSection>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
            >
              Batal
            </Button>
            <Button icon={faFileArrowDown} onClick={handleExport} disabled={isPending}>
              {isPending ? "Menyiapkan file..." : "Export laporan"}
            </Button>
          </div>
        </div>
      </ModalDialog>
    </>
  );
}
