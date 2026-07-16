"use client";

import {
  faGavel,
  faTrash,
  faWandSparkles
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
import { formatRecommendationPeriodLabel } from "@/lib/reward-punishment";
import { formatAverageScore } from "@/lib/scoring";
import { TIME_PRESET_OPTIONS, type TimePreset } from "@/lib/time-presets";

type RecommendationListSectionProps = {
  summary: Record<"RECOMMENDED" | "APPROVED" | "REJECTED", number>;
  search: string;
  officerFilter: string;
  unitFilter: string;
  typeFilter: "all" | "EVALUASI" | "REWARD" | "PUNISHMENT";
  statusFilter: "all" | "RECOMMENDED" | "APPROVED" | "REJECTED";
  timePreset: TimePreset;
  officers: Array<{ id: string; name: string; nip: string; unitName: string }>;
  units: Array<{ id: string; name: string }>;
  recommendations: Array<{
    id: string;
    type: "EVALUASI" | "REWARD" | "PUNISHMENT";
    status: "RECOMMENDED" | "APPROVED" | "REJECTED";
    category: string;
    triggerScore: number;
    periodKind:
      | "DAILY"
      | "WORKWEEK"
      | "MONTHLY"
      | "QUARTERLY"
      | "SEMIANNUAL"
      | "YEARLY";
    periodStart: string | Date;
    periodEnd: string | Date;
    officer: {
      name: string;
      nip: string;
      unit: { name: string } | null;
    };
  }>;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  deletingRecommendationId: string | null;
  getTypeVariant: (type: "EVALUASI" | "REWARD" | "PUNISHMENT") => "default" | "success" | "danger";
  getTypeLabel: (type: "EVALUASI" | "REWARD" | "PUNISHMENT") => string;
  getStatusVariant: (status: "RECOMMENDED" | "APPROVED" | "REJECTED") => "warning" | "success" | "danger";
  getStatusLabel: (status: "RECOMMENDED" | "APPROVED" | "REJECTED") => string;
  onSearchChange: (value: string) => void;
  onOfficerChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onTypeChange: (value: "all" | "EVALUASI" | "REWARD" | "PUNISHMENT") => void;
  onStatusChange: (value: "all" | "RECOMMENDED" | "APPROVED" | "REJECTED") => void;
  onTimePresetChange: (value: TimePreset) => void;
  onResetFilters: () => void;
  onOpenGenerate: () => void;
  onOpenDetail: (recommendationId: string) => void;
  onDelete: (recommendationId: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  hasSeedData: boolean;
  showControls?: boolean;
};

export function RecommendationListSection({
  summary,
  search,
  officerFilter,
  unitFilter,
  typeFilter,
  statusFilter,
  timePreset,
  officers,
  units,
  recommendations,
  totalItems,
  currentPage,
  totalPages,
  rowsPerPage,
  deletingRecommendationId,
  getTypeVariant,
  getTypeLabel,
  getStatusVariant,
  getStatusLabel,
  onSearchChange,
  onOfficerChange,
  onUnitChange,
  onTypeChange,
  onStatusChange,
  onTimePresetChange,
  onResetFilters,
  onOpenGenerate,
  onOpenDetail,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
  hasSeedData,
  showControls = true
}: RecommendationListSectionProps) {
  return (
    <section className="space-y-5">
      {showControls ? (
        <ModuleFilters>
          <FilterFields columnsClassName="md:grid-cols-2 xl:grid-cols-6">
            <FilterSearchField
              label="Cari petugas"
              value={search}
              onChange={onSearchChange}
              placeholder="Cari nama atau NIP"
            />

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

            <FilterSelectField
              label="Petugas"
              value={officerFilter}
              onChange={onOfficerChange}
            >
              <option value="all">Semua petugas</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {officer.nip} - {officer.unitName}
                </option>
              ))}
            </FilterSelectField>

            <FilterSelectField label="Unit" value={unitFilter} onChange={onUnitChange}>
              <option value="all">Semua unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </FilterSelectField>

            <FilterSelectField
              label="Tipe"
              value={typeFilter}
              onChange={(value) => onTypeChange(value as typeof typeFilter)}
            >
              <option value="all">Semua tipe</option>
              <option value="EVALUASI">Evaluasi</option>
              <option value="REWARD">Reward</option>
              <option value="PUNISHMENT">Punishment</option>
            </FilterSelectField>

            <FilterSelectField
              label="Status"
              value={statusFilter}
              onChange={(value) => onStatusChange(value as typeof statusFilter)}
            >
              <option value="all">Semua status</option>
              <option value="RECOMMENDED">Menunggu keputusan</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </FilterSelectField>
          </FilterFields>

          <FilterActions className="flex-wrap">
            <Button icon={faWandSparkles} onClick={onOpenGenerate}>
              Generate Data
            </Button>
            <FilterResetButton onClick={onResetFilters}>
              Reset Filter
            </FilterResetButton>
          </FilterActions>
        </ModuleFilters>
      ) : null}

      <ModuleTableSection
        title="Daftar hasil evaluasi dan tindak lanjut"
        description={`${totalItems} data sesuai filter aktif.`}
        headers={[
          "Periode",
          "Petugas",
          "Tipe",
          "Skor",
          "Kategori",
          "Status",
          "Aksi"
        ]}
        isEmpty={!recommendations.length}
        emptyState={
          <EmptyState
            title={
              hasSeedData
                ? "Tidak ada data untuk filter ini"
                : "Belum ada data yang dibuat"
            }
            description={
              hasSeedData
                ? "Ubah periode, petugas, status, tipe, atau unit agar data lain muncul."
                : "Generate evaluasi, reward, atau punishment baru agar daftar mulai terisi."
            }
            icon="RP"
            actionLabel="Generate Data"
            onAction={onOpenGenerate}
          />
        }
      >
        {recommendations.map((item) => (
          <tr key={item.id} className="border-t border-[var(--border)]">
            <td className="px-5 py-4 font-medium">
              {formatRecommendationPeriodLabel({
                periodKind: item.periodKind,
                periodStart: item.periodStart,
                periodEnd: item.periodEnd
              })}
            </td>
            <td className="px-5 py-4">
              <EntityIdentityCell
                name={item.officer.name}
                subtitle={`${item.officer.nip} · ${item.officer.unit?.name ?? "Tanpa unit"}`}
              />
            </td>
            <td className="px-5 py-4">
              <Badge variant={getTypeVariant(item.type)}>
                {getTypeLabel(item.type)}
              </Badge>
            </td>
            <td className="px-5 py-4 font-semibold">
              {formatAverageScore(item.triggerScore)}
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">{item.category}</td>
            <td className="px-5 py-4">
              <Badge variant={getStatusVariant(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
            </td>
            <td className="px-5 py-4">
              <ActionMenu
                items={[
                  {
                    label:
                      item.status === "RECOMMENDED"
                        ? "Detail dan keputusan"
                        : "Lihat detail",
                    icon: faGavel,
                    onClick: () => onOpenDetail(item.id)
                  },
                  {
                    label:
                      deletingRecommendationId === item.id
                        ? "Menghapus..."
                        : "Hapus data",
                    icon: faTrash,
                    variant: "danger",
                    disabled: deletingRecommendationId === item.id,
                    onClick: () => onDelete(item.id)
                  }
                ]}
              />
            </td>
          </tr>
        ))}
      </ModuleTableSection>

      <ModulePagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </section>
  );
}
