"use client";

import {
  faClipboardList,
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
  FilterSearchField,
  FilterSelectField,
  ModuleFilters
} from "@/components/ui/module-filters";
import {
  ModulePagination,
  ModuleTableSection
} from "@/components/ui/module-table-section";

type OfficerListSectionProps = {
  search: string;
  unitFilter: string;
  statusFilter: "all" | "active" | "inactive";
  sortBy: "name" | "nip" | "unit";
  sortDirection: "asc" | "desc";
  units: Array<{ id: string; name: string }>;
  officers: Array<{
    id: string;
    nip: string;
    name: string;
    jabatan: string | null;
    isActive: boolean;
    unit: { name: string } | null;
  }>;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  deletingOfficerId: string | null;
  hasAnyData: boolean;
  onSearchChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "inactive") => void;
  onSortChange: (value: "name" | "nip" | "unit") => void;
  onOpenCreate: () => void;
  onOpenHistory: (officerId: string) => void;
  onEdit: (officerId: string) => void;
  onDelete: (officerId: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
};

export function OfficerListSection({
  search,
  unitFilter,
  statusFilter,
  sortBy,
  sortDirection,
  units,
  officers,
  totalItems,
  currentPage,
  totalPages,
  rowsPerPage,
  deletingOfficerId,
  hasAnyData,
  onSearchChange,
  onUnitChange,
  onStatusChange,
  onSortChange,
  onOpenCreate,
  onOpenHistory,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange
}: OfficerListSectionProps) {
  return (
    <section className="space-y-5">
      <ModuleFilters>
        <FilterFields>
          <FilterSearchField
            label="Cari petugas"
            value={search}
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
            label="Status aktif"
            value={statusFilter}
            onChange={(value) => onStatusChange(value as "all" | "active" | "inactive")}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </FilterSelectField>

          <FilterSelectField
            label="Urutkan"
            value={sortBy}
            onChange={(value) => onSortChange(value as "name" | "nip" | "unit")}
          >
            <option value="name">Nama</option>
            <option value="nip">NIP</option>
            <option value="unit">Unit</option>
          </FilterSelectField>
        </FilterFields>

        <FilterActions>
          <Button icon={faPlus} onClick={onOpenCreate}>
            Tambah Petugas
          </Button>
        </FilterActions>
      </ModuleFilters>

      <ModuleTableSection
        title="Daftar petugas PST"
        description={`${totalItems} data sesuai filter aktif.`}
        headers={[
          {
            key: "nip",
            label: "NIP",
            sortable: true,
            sortDirection: sortBy === "nip" ? sortDirection : null,
            onSort: () => onSortChange("nip")
          },
          {
            key: "name",
            label: "Nama",
            sortable: true,
            sortDirection: sortBy === "name" ? sortDirection : null,
            onSort: () => onSortChange("name")
          },
          {
            key: "unit",
            label: "Unit",
            sortable: true,
            sortDirection: sortBy === "unit" ? sortDirection : null,
            onSort: () => onSortChange("unit")
          },
          "Jabatan",
          "Status",
          "Aksi"
        ]}
        isEmpty={!officers.length}
        emptyState={
          <EmptyState
            title={
              hasAnyData
                ? "Tidak ada hasil untuk filter ini"
                : "Belum ada petugas PST"
            }
            description={
              hasAnyData
                ? "Ubah kata kunci, filter unit, atau status aktif agar data lain muncul."
                : "Tambahkan petugas baru agar modul penilaian dan jadwal bisa mulai dipakai."
            }
            icon="P"
            actionLabel="Tambah Petugas"
            onAction={onOpenCreate}
          />
        }
      >
        {officers.map((officer) => (
          <tr key={officer.id} className="border-t border-[var(--border)]">
            <td className="px-5 py-4 font-medium">{officer.nip}</td>
            <td className="px-5 py-4">
              <EntityIdentityCell
                name={officer.name}
                helperText="Detail singkat petugas PST"
              />
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              {officer.unit?.name ?? "-"}
            </td>
            <td className="px-5 py-4 text-[var(--muted)]">
              {officer.jabatan || "-"}
            </td>
            <td className="px-5 py-4">
              <Badge variant={officer.isActive ? "success" : "warning"}>
                {officer.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </td>
            <td className="px-5 py-4">
              <ActionMenu
                items={[
                  {
                    label: "Riwayat penilaian",
                    icon: faClipboardList,
                    onClick: () => onOpenHistory(officer.id)
                  },
                  {
                    label: "Edit petugas",
                    icon: faPenToSquare,
                    onClick: () => onEdit(officer.id)
                  },
                  {
                    label:
                      deletingOfficerId === officer.id
                        ? "Menghapus..."
                        : "Hapus petugas",
                    icon: faTrash,
                    variant: "danger",
                    disabled: deletingOfficerId === officer.id,
                    onClick: () => onDelete(officer.id)
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
