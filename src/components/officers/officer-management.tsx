"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import {
  faClipboardList,
  faPenToSquare,
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OfficerFormDialog } from "@/components/officers/officer-form-dialog";
import { OfficerHistoryDialog } from "@/components/officers/officer-history-dialog";
import { OfficerListSection } from "@/components/officers/officer-list-section";
import { formatDateOnlyDisplay } from "@/lib/date-only";
import { applyServerFormErrors, getApiErrorMessage } from "@/lib/form-api";
import type { PaginatedData } from "@/lib/pagination";
import {
  officerJabatanOptions,
  officerSchema,
  type OfficerFormValues
} from "@/lib/validations/officer";

type UnitOption = {
  id: string;
  name: string;
};

type OfficerItem = {
  id: string;
  nip: string;
  name: string;
  jabatan: string | null;
  unitId: string | null;
  isActive: boolean;
  unit: UnitOption | null;
};

type OfficerAssessmentHistoryItem = {
  id: string;
  assessmentDate: string;
  status: "PRESENT" | "ABSENT";
  averageScore: number | null;
  notes: string | null;
  assessor: {
    id: string;
    name: string | null;
    role: string;
  };
  scores: Array<{
    id: string;
    score: number;
    criteria: {
      id: string;
      name: string;
      sortOrder: number;
    };
  }>;
};

type OfficerHistoryResponse = {
  officer: {
    id: string;
    name: string;
    nip: string;
    unit: UnitOption | null;
  };
  filters: {
    from: string;
    to: string;
  };
  assessments: OfficerAssessmentHistoryItem[];
};

type OfficerManagementProps = {
  initialOfficers: PaginatedData<OfficerItem>;
  units: UnitOption[];
  userName: string;
  role: string;
};

type SortOption = "name" | "nip" | "unit";
type StatusFilter = "all" | "active" | "inactive";

function normalizeOfficerJabatanOption(jabatan: string | null) {
  const normalizedJabatan = jabatan?.trim().toLowerCase();

  return (
    officerJabatanOptions.find(
      (option) => option.toLowerCase() === normalizedJabatan
    ) ?? ""
  );
}

export function OfficerManagement({
  initialOfficers,
  units,
  role
}: OfficerManagementProps) {
  const [officers, setOfficers] = useState<OfficerItem[]>(initialOfficers.data);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerItem | null>(null);
  const [pendingSubmitValues, setPendingSubmitValues] =
    useState<OfficerFormValues | null>(null);
  const [confirmingOfficer, setConfirmingOfficer] = useState<OfficerItem | null>(
    null
  );
  const [deletingOfficerId, setDeletingOfficerId] = useState<string | null>(null);
  const [historyOfficer, setHistoryOfficer] = useState<OfficerItem | null>(null);
  const [historyItems, setHistoryItems] = useState<OfficerAssessmentHistoryItem[]>([]);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(initialOfficers.meta.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialOfficers.meta.rowsPerPage);
  const [totalItems, setTotalItems] = useState(initialOfficers.meta.totalItems);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const hasMountedRef = useRef(false);

  const form = useForm<OfficerFormValues>({
    resolver: zodResolver(officerSchema),
    mode: "onChange",
    defaultValues: {
      nip: "",
      name: "",
      jabatan: "",
      unitId: "",
      isActive: true
    }
  });

  const { register, handleSubmit, reset, formState, setValue, setError } = form;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const pendingUnitName = pendingSubmitValues?.unitId
    ? units.find((unit) => unit.id === pendingSubmitValues.unitId)?.name ??
      "Belum ditentukan"
    : "Belum ditentukan";
  const pendingStatusLabel = pendingSubmitValues?.isActive ? "Aktif" : "Nonaktif";

  const loadOfficers = useCallback(async (
    overrides?: Partial<{
      search: string;
      unitFilter: string;
      statusFilter: StatusFilter;
      sortBy: SortOption;
      page: number;
      rowsPerPage: number;
    }>
  ) => {
    const params = new URLSearchParams({
      search: overrides?.search ?? deferredSearch,
      unitId:
        (overrides?.unitFilter ?? unitFilter) === "all"
          ? ""
          : (overrides?.unitFilter ?? unitFilter),
      status:
        (overrides?.statusFilter ?? statusFilter) === "all"
          ? ""
          : (overrides?.statusFilter ?? statusFilter),
      sortBy: overrides?.sortBy ?? sortBy,
      sortDirection,
      page: String(overrides?.page ?? page),
      rowsPerPage: String(overrides?.rowsPerPage ?? rowsPerPage)
    });
    const response = await fetch(`/api/officers?${params.toString()}`);
    const result = (await response.json()) as {
      message?: string;
      data?: OfficerItem[];
      meta?: PaginatedData<OfficerItem>["meta"];
    };

    if (!response.ok || !result.data || !result.meta) {
      toast.error(getApiErrorMessage(result, "Gagal memuat daftar petugas."));
      return;
    }

    setOfficers(result.data);
    setPage(result.meta.page);
    setRowsPerPage(result.meta.rowsPerPage);
    setTotalItems(result.meta.totalItems);
  }, [deferredSearch, page, rowsPerPage, sortBy, sortDirection, statusFilter, unitFilter]);

  function toggleSort(nextSortBy: SortOption) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection("asc");
  }

  function resetForm() {
    setIsFormDialogOpen(false);
    setEditingOfficer(null);
    setIsActiveValue(true);
    reset({
      nip: "",
      name: "",
      jabatan: "",
      unitId: "",
      isActive: true
    });
  }

  function startEditMode(officer: OfficerItem) {
    setIsFormDialogOpen(true);
    setEditingOfficer(officer);
    setIsActiveValue(officer.isActive);
    reset({
      nip: officer.nip,
      name: officer.name,
      jabatan: normalizeOfficerJabatanOption(officer.jabatan),
      unitId: officer.unitId ?? "",
      isActive: officer.isActive
    });
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void loadOfficers();
  }, [deferredSearch, loadOfficers, page, rowsPerPage, sortBy, sortDirection, statusFilter, unitFilter]);

  async function onSubmit(values: OfficerFormValues) {
    const endpoint = editingOfficer
      ? `/api/officers/${editingOfficer.id}`
      : "/api/officers";
    const method = editingOfficer ? "PATCH" : "POST";

    startTransition(async () => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const result = (await response.json()) as {
        message: string;
        data?: OfficerItem;
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(setError, result.errors);
        setIsFormDialogOpen(true);
        toast.error(
          getApiErrorMessage(
            result,
            editingOfficer
              ? "Gagal memperbarui petugas. Periksa kembali NIP, nama, jabatan, dan unit."
              : "Gagal menambahkan petugas. Periksa kembali NIP, nama, jabatan, dan unit."
          )
        );
        return;
      }

      const nextOfficer = result.data;

      if (editingOfficer) {
        toast.success(
          result.message || `Petugas "${nextOfficer.name}" berhasil diperbarui.`
        );
      } else {
        toast.success(
          result.message || `Petugas "${nextOfficer.name}" berhasil ditambahkan.`
        );
      }

      await loadOfficers({ page: editingOfficer ? page : 1 });
      resetForm();
    });
  }

  async function deleteOfficer(officer: OfficerItem) {
    setDeletingOfficerId(officer.id);

    try {
      const response = await fetch(`/api/officers/${officer.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus petugas.");
        return;
      }

      if (editingOfficer?.id === officer.id) {
        resetForm();
      }

      const nextPage = officers.length === 1 && page > 1 ? page - 1 : page;
      await loadOfficers({ page: nextPage });

      toast.success(result.message || "Petugas berhasil dihapus.");
    } finally {
      setDeletingOfficerId(null);
    }
  }

  async function loadOfficerHistory(
    officer: OfficerItem,
    filters?: {
      from?: string;
      to?: string;
    }
  ) {
    setHistoryOfficer(officer);
    setIsHistoryLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters?.from) {
        params.set("from", filters.from);
      }

      if (filters?.to) {
        params.set("to", filters.to);
      }

      const query = params.toString();
      const response = await fetch(
        `/api/officers/${officer.id}/assessments${query ? `?${query}` : ""}`
      );

      const result = (await response.json()) as {
        message?: string;
        data?: OfficerHistoryResponse;
      };

      if (!response.ok || !result.data) {
        toast.error(
          getApiErrorMessage(
            result,
            `Gagal memuat riwayat penilaian untuk ${officer.name}.`
          )
        );
        return;
      }

      setHistoryOfficer(officer);
      setHistoryItems(result.data.assessments);
      setHistoryFrom(result.data.filters.from);
      setHistoryTo(result.data.filters.to);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  function formatDateLabel(value: string) {
    return formatDateOnlyDisplay(value);
  }

  return (
    <DashboardShell
      title="Master Data Petugas PST"
      description="Kelola daftar petugas PST yang akan dinilai. Modul ini mendukung pencarian, filter unit, status aktif, dan pengeditan cepat untuk skala data yang lebih besar."
      role={role}
    >
      <OfficerListSection
        search={search}
        unitFilter={unitFilter}
        statusFilter={statusFilter}
        sortBy={sortBy}
        sortDirection={sortDirection}
        units={units}
        officers={officers}
        totalItems={totalItems}
        currentPage={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        deletingOfficerId={deletingOfficerId}
        hasAnyData={Boolean(search || unitFilter !== "all" || statusFilter !== "all" || totalItems > 0)}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onUnitChange={(value) => {
          setUnitFilter(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onSortChange={(value) => {
          toggleSort(value);
          setPage(1);
        }}
        onOpenCreate={() => {
          resetForm();
          setIsFormDialogOpen(true);
        }}
        onOpenHistory={(officerId) => {
          const officer = officers.find((item) => item.id === officerId);
          if (!officer) {
            return;
          }

          setHistoryOfficer(officer);
          setHistoryItems([]);
          setHistoryFrom("");
          setHistoryTo("");
          void loadOfficerHistory(officer, {
            from: "",
            to: ""
          });
        }}
        onEdit={(officerId) => {
          const officer = officers.find((item) => item.id === officerId);
          if (officer) {
            startEditMode(officer);
          }
        }}
        onDelete={(officerId) => {
          const officer = officers.find((item) => item.id === officerId);
          if (officer) {
            setConfirmingOfficer(officer);
          }
        }}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(1);
        }}
      />

      <OfficerHistoryDialog
        open={Boolean(historyOfficer)}
        officer={historyOfficer}
        historyItems={historyItems}
        historyFrom={historyFrom}
        historyTo={historyTo}
        isLoading={isHistoryLoading}
        formatDateLabel={formatDateLabel}
        onClose={() => {
          if (!isHistoryLoading) {
            setHistoryOfficer(null);
            setHistoryItems([]);
            setHistoryFrom("");
            setHistoryTo("");
          }
        }}
        onFromChange={setHistoryFrom}
        onToChange={setHistoryTo}
        onApply={() => {
          if (historyOfficer) {
            void loadOfficerHistory(historyOfficer, {
              from: historyFrom,
              to: historyTo
            });
          }
        }}
        onReset={() => {
          if (historyOfficer) {
            setHistoryFrom("");
            setHistoryTo("");
            void loadOfficerHistory(historyOfficer, {
              from: "",
              to: ""
            });
          }
        }}
      />

      <OfficerFormDialog
        open={isFormDialogOpen}
        editingOfficer={Boolean(editingOfficer)}
        form={form}
        units={units}
        isActiveValue={isActiveValue}
        isPending={isPending}
        onClose={resetForm}
        onSubmit={(values) => {
          setIsFormDialogOpen(false);
          setPendingSubmitValues(values);
        }}
        onToggleActive={() => {
          const nextValue = !isActiveValue;
          setIsActiveValue(nextValue);
          setValue("isActive", nextValue);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingSubmitValues)}
        title={
          editingOfficer ? "Simpan perubahan petugas?" : "Tambah petugas baru?"
        }
        description={
          editingOfficer
            ? (
                <div className="space-y-3">
                  <p>Perubahan data petugas berikut akan langsung diperbarui di sistem.</p>
                  {pendingSubmitValues ? (
                    <div className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card-bg-strong)] p-3 text-sm text-[var(--foreground)]">
                      <p><span className="font-semibold">NIP:</span> {pendingSubmitValues.nip}</p>
                      <p><span className="font-semibold">Nama:</span> {pendingSubmitValues.name}</p>
                      <p><span className="font-semibold">Jabatan:</span> {pendingSubmitValues.jabatan || "Belum ditentukan"}</p>
                      <p><span className="font-semibold">Unit:</span> {pendingUnitName}</p>
                      <p><span className="font-semibold">Status:</span> {pendingStatusLabel}</p>
                    </div>
                  ) : null}
                </div>
              )
            : (
                <div className="space-y-3">
                  <p>Petugas baru berikut akan langsung tersedia di modul penilaian.</p>
                  {pendingSubmitValues ? (
                    <div className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card-bg-strong)] p-3 text-sm text-[var(--foreground)]">
                      <p><span className="font-semibold">NIP:</span> {pendingSubmitValues.nip}</p>
                      <p><span className="font-semibold">Nama:</span> {pendingSubmitValues.name}</p>
                      <p><span className="font-semibold">Jabatan:</span> {pendingSubmitValues.jabatan || "Belum ditentukan"}</p>
                      <p><span className="font-semibold">Unit:</span> {pendingUnitName}</p>
                      <p><span className="font-semibold">Status:</span> {pendingStatusLabel}</p>
                    </div>
                  ) : null}
                </div>
              )
        }
        variant="primary"
        icon={editingOfficer ? faPenToSquare : faPlus}
        confirmLabel={editingOfficer ? "Ya, simpan perubahan" : "Ya, tambah petugas"}
        isLoading={isPending}
        onClose={() => {
          if (!isPending) {
            setPendingSubmitValues(null);
            setIsFormDialogOpen(true);
          }
        }}
        onConfirm={() => {
          if (pendingSubmitValues) {
            void onSubmit(pendingSubmitValues);
            setPendingSubmitValues(null);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmingOfficer)}
        title={
          confirmingOfficer
            ? `Hapus petugas ${confirmingOfficer.name}?`
            : "Hapus petugas?"
        }
        description="Semua histori penilaian harian dan reward atau punishment milik petugas ini juga akan ikut dihapus permanen."
        isLoading={
          Boolean(confirmingOfficer) &&
          deletingOfficerId === confirmingOfficer?.id
        }
        onClose={() => {
          if (!deletingOfficerId) {
            setConfirmingOfficer(null);
          }
        }}
        onConfirm={() => {
          if (confirmingOfficer) {
            void deleteOfficer(confirmingOfficer).finally(() =>
              setConfirmingOfficer(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
