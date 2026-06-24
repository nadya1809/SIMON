"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
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
    });
  }

  return (
    <div className="space-y-4 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-bold">Export laporan</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pilih format file lalu generate laporan sesuai filter aktif.
        </p>
      </div>

      <FormField label="Format export">
        <Select
          value={format}
          onChange={(event) => setFormat(event.target.value as "pdf" | "xlsx")}
        >
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="pdf">PDF (.pdf)</option>
        </Select>
      </FormField>

      <Button className="w-full" onClick={handleExport} disabled={isPending}>
        {isPending ? "Menyiapkan file..." : "Export laporan"}
      </Button>
    </div>
  );
}
