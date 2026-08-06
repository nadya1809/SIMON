"use client";

import { useMemo, useState, useTransition } from "react";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { SectionCard } from "@/components/ui/section-card";
import { Select } from "@/components/ui/select";
import { SearchableOfficerSelect } from "@/components/ui/searchable-officer-select";
import {
  getDefaultTimePreset,
  getTimePresetRange,
  TIME_PRESET_OPTIONS,
  type TimePreset
} from "@/lib/time-presets";
import { cn } from "@/lib/utils";

type RewardPunishmentExportPanelProps = {
  officerId: string;
  unitId: string;
  type: string;
  status: string;
  from: string;
  to: string;
  timePreset: TimePreset;
  units: Array<{ id: string; name: string }>;
  officers: Array<{ id: string; name: string; nip: string; unitName: string }>;
  className?: string;
};

export function RewardPunishmentExportPanel({
  officerId,
  unitId,
  type,
  status,
  from,
  to,
  timePreset,
  units,
  officers,
  className
}: RewardPunishmentExportPanelProps) {
  const [format, setFormat] = useState<"pdf" | "xlsx">("xlsx");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [exportTimePreset, setExportTimePreset] = useState<TimePreset>(timePreset);
  const [exportUnitId, setExportUnitId] = useState(unitId);
  const [exportOfficerId, setExportOfficerId] = useState(officerId);
  const exportRange = getTimePresetRange(exportTimePreset);
  const exportFrom = exportTimePreset === "all" ? from : exportRange.from;
  const exportTo = exportTimePreset === "all" ? to : exportRange.to;
  const filteredOfficers = useMemo(
    () =>
      officers.filter((officer) =>
        exportUnitId
          ? officer.unitName === units.find((unit) => unit.id === exportUnitId)?.name
          : true
      ),
    [exportUnitId, officers, units]
  );

  function resetExportFilters() {
    setExportTimePreset(getDefaultTimePreset());
    setExportUnitId("");
    setExportOfficerId("");
  }

  async function handleExport() {
    startTransition(async () => {
      const searchParams = new URLSearchParams({
        format,
        officerId: exportOfficerId,
        unitId: exportUnitId,
        type,
        status,
        from: exportFrom,
        to: exportTo
      });

      const response = await fetch(
        `/api/reward-punishment/export?${searchParams.toString()}`
      );

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
        `evaluasi-reward-punishment.${format === "xlsx" ? "xlsx" : "pdf"}`;
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
                  Unduh laporan evaluasi, reward, dan punishment
                </h3>
              </div>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">
              Gunakan panel ini untuk menyiapkan file Excel atau PDF berisi
              daftar hasil evaluasi dan tindak lanjut sesuai tabel dan filter
              yang sedang aktif.
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Format export mengikuti waktu, petugas, unit, tipe, dan status yang sedang dipilih
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
        title="Unduh laporan evaluasi, reward, dan punishment"
        description="Pilih format file lalu generate laporan sesuai filter aktif."
      >
        <div className="space-y-4">
          <FormSection
            title="Filter data unduhan"
            description="Atur waktu, unit, dan petugas yang ingin dimasukkan ke file unduhan."
          >
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={resetExportFilters}
              >
                Reset
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Filter waktu">
                <Select
                  value={exportTimePreset}
                  onChange={(event) =>
                    setExportTimePreset(event.target.value as TimePreset)
                  }
                >
                  {TIME_PRESET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Filter unit">
                <Select
                  value={exportUnitId}
                  onChange={(event) => {
                    const nextUnitId = event.target.value;
                    setExportUnitId(nextUnitId);
                    const selectedOfficerStillVisible = officers.some(
                      (officer) =>
                        officer.id === exportOfficerId &&
                        (!nextUnitId ||
                          officer.unitName ===
                            units.find((unit) => unit.id === nextUnitId)?.name)
                    );

                    if (!selectedOfficerStillVisible) {
                      setExportOfficerId("");
                    }
                  }}
                >
                  <option value="">Semua unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Filter petugas">
                <SearchableOfficerSelect
                  value={exportOfficerId}
                  officers={filteredOfficers}
                  onChange={setExportOfficerId}
                />
              </FormField>
            </div>
          </FormSection>

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
