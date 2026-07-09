"use client";

import {
  faPenToSquare,
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityIdentityCell } from "@/components/ui/entity-identity-cell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterActions,
  FilterFields,
  FilterResetButton,
  FilterSearchField,
  FilterSelectField,
  ModuleFilters
} from "@/components/ui/module-filters";
import {
  ModulePagination,
  ModuleTableSection
} from "@/components/ui/module-table-section";
import { formatDateOnlyUtc } from "@/lib/date-only";
import { formatAverageScore } from "@/lib/scoring";
import { TIME_PRESET_OPTIONS, type TimePreset } from "@/lib/time-presets";

type AssessmentListSectionProps = {
  searchOfficer: string;
  unitFilter: string;
  statusFilter: "all" | "PRESENT" | "ABSENT";
  timePreset: TimePreset;
  units: Array<{ id: string; name: string }>;
  assessments: Array<{
    id: string;
    assessmentDate: string | Date;
    status: "PRESENT" | "ABSENT";
    averageScore: number | null;
    officer: {
      name: string;
      nip: string;
      unit: { name: string } | null;
    };
    scores: Array<{
      score: number;
      criteria: { name: string };
    }>;
  }>;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  rowsPerPage: number;
  hasActiveFilters: boolean;
  isListLoading: boolean;
  deletingAssessmentId: string | null;
  onSearchChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onStatusChange: (value: "all" | "PRESENT" | "ABSENT") => void;
  onTimePresetChange: (value: TimePreset) => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onEdit: (assessmentId: string) => void;
  onDelete: (assessmentId: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
};

export function AssessmentListSection({
  searchOfficer,
  unitFilter,
  statusFilter,
  timePreset,
  units,
  assessments,
  pagination,
  rowsPerPage,
  hasActiveFilters,
  isListLoading,
  deletingAssessmentId,
  onSearchChange,
  onUnitChange,
  onStatusChange,
  onTimePresetChange,
  onResetFilters,
  onOpenCreate,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange
}: AssessmentListSectionProps) {
  return (
    <section className="space-y-5">
      <ModuleFilters>
        <FilterFields>
          <FilterSearchField
            label="Cari petugas"
            value={searchOfficer}
            onChange={onSearchChange}
            placeholder="Cari nama atau NIP"
          />

          <FilterSelectField
            label="Filter unit"
            value={unitFilter}
            onChange={onUnitChange}
          >
            <option value="all">Semua unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </FilterSelectField>

          <FilterSelectField
            label="Status hadir"
            value={statusFilter}
            onChange={(value) => onStatusChange(value as "all" | "PRESENT" | "ABSENT")}
          >
            <option value="all">Semua status</option>
            <option value="PRESENT">Hadir</option>
            <option value="ABSENT">Tidak Hadir</option>
          </FilterSelectField>

          <FilterSelectField
            label="Filter waktu"
            value={timePreset}
            onChange={(value) => onTimePresetChange(value as TimePreset)}
          >
            {TIME_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelectField>
        </FilterFields>

        <FilterActions className="flex-wrap">
          <Button icon={faPlus} onClick={onOpenCreate}>
            Input Penilaian
          </Button>
          <FilterResetButton onClick={onResetFilters}>
            Reset Filter
          </FilterResetButton>
        </FilterActions>
      </ModuleFilters>

      <ModuleTableSection
        title="Riwayat penilaian"
        description={
          isListLoading
            ? "Memuat data penilaian terbaru..."
            : `${pagination.totalItems} data sesuai filter aktif.`
        }
        headers={[
          "Tanggal",
          "Petugas",
          "Unit",
          "Status",
          "Skor",
          "Rata-rata",
          "Aksi"
        ]}
        isEmpty={!assessments.length}
        emptyState={
          <EmptyState
            title={
              hasActiveFilters
                ? "Tidak ada penilaian untuk filter ini"
                : "Belum ada penilaian harian"
            }
            description={
              hasActiveFilters
                ? "Ubah filter tanggal, unit, atau nama petugas untuk melihat data yang lain."
                : "Tambahkan penilaian pertama agar monitoring harian petugas PST mulai berjalan."
            }
            icon="A"
            actionLabel="Input Penilaian"
            onAction={onOpenCreate}
          />
        }
      >
        {assessments.map((item) => (
          <tr key={item.id} className="border-t border-[var(--border)]">
            <td className="px-5 py-4 font-medium">
              {formatDateOnlyUtc(item.assessmentDate)}
            </td>
            <td className="px-5 py-4">
              <EntityIdentityCell
                name={item.officer.name}
                subtitle={`NIP: ${item.officer.nip}`}
              />
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              {item.officer.unit?.name ?? "-"}
            </td>
            <td className="px-5 py-4">
              <Badge variant={item.status === "PRESENT" ? "success" : "warning"}>
                {item.status === "PRESENT" ? "Hadir" : "Tidak Hadir"}
              </Badge>
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              {item.status === "ABSENT"
                ? "-"
                : item.scores
                    .map((score) => `${score.criteria.name}: ${score.score}`)
                    .join(", ")}
            </td>
            <td className="px-5 py-4 font-semibold">
              {formatAverageScore(item.averageScore)}
            </td>
            <td className="px-5 py-4">
              <ActionMenu
                items={[
                  {
                    label: "Edit penilaian",
                    icon: faPenToSquare,
                    onClick: () => onEdit(item.id)
                  },
                  {
                    label:
                      deletingAssessmentId === item.id
                        ? "Menghapus..."
                        : "Hapus penilaian",
                    icon: faTrash,
                    variant: "danger",
                    disabled: deletingAssessmentId === item.id,
                    onClick: () => onDelete(item.id)
                  }
                ]}
              />
            </td>
          </tr>
        ))}
      </ModuleTableSection>

      <ModulePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </section>
  );
}
