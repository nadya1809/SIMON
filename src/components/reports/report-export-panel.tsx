"use client";

import { useState, useTransition } from "react";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { SectionCard } from "@/components/ui/section-card";
import { Select } from "@/components/ui/select";

type ReportExportPanelProps = {
  from: string;
  to: string;
  unitId: string;
};

export function ReportExportPanel({
  from,
  to,
  unitId
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
      <SectionCard className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-bold">Export laporan</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Buka dialog export untuk memilih format file sesuai filter aktif.
          </p>
        </div>

        <Button
          className="w-full"
          icon={faFileArrowDown}
          onClick={() => setIsDialogOpen(true)}
        >
          Buka Dialog Export
        </Button>
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
