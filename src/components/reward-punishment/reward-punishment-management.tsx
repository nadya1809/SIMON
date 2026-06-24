"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  faCheck,
  faGavel,
  faRotateLeft,
  faTrash,
  faTriangleExclamation,
  faTrophy,
  faWandSparkles
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormField } from "@/components/forms/form-field";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SectionCard } from "@/components/ui/section-card";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatAverageScore } from "@/lib/scoring";
import {
  rewardPunishmentActionSchema,
  rewardPunishmentGenerationSchema,
  type RewardPunishmentActionInput,
  type RewardPunishmentActionValues,
  type RewardPunishmentGenerationInput,
  type RewardPunishmentGenerationValues
} from "@/lib/validations/reward-punishment";

type UnitOption = {
  id: string;
  name: string;
};

type RecommendationItem = {
  id: string;
  officerId: string;
  type: "REWARD" | "PUNISHMENT";
  category: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  triggerScore: number;
  status: "RECOMMENDED" | "APPROVED" | "REJECTED";
  decidedAt: string | Date | null;
  notes: string | null;
  createdAt: string | Date;
  officer: {
    id: string;
    name: string;
    nip: string;
    unit: UnitOption | null;
  };
  decidedBy: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
};

type RewardPunishmentManagementProps = {
  initialRecommendations: RecommendationItem[];
  units: UnitOption[];
  defaultPeriod: string;
  userName: string;
  role: string;
};

type StatusFilter = "all" | "RECOMMENDED" | "APPROVED" | "REJECTED";
type TypeFilter = "all" | "REWARD" | "PUNISHMENT";

function toDateLabel(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function toMonthInputValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function toMonthLabel(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function getStatusVariant(status: RecommendationItem["status"]) {
  if (status === "APPROVED") {
    return "success" as const;
  }

  if (status === "REJECTED") {
    return "danger" as const;
  }

  return "warning" as const;
}

function getStatusLabel(status: RecommendationItem["status"]) {
  if (status === "APPROVED") {
    return "Approved";
  }

  if (status === "REJECTED") {
    return "Rejected";
  }

  return "Recommended";
}

function getTypeVariant(type: RecommendationItem["type"]) {
  return type === "REWARD" ? "success" : "danger";
}

function getTypeLabel(type: RecommendationItem["type"]) {
  return type === "REWARD" ? "Reward" : "Punishment";
}

function mergeRecommendations(
  current: RecommendationItem[],
  incoming: RecommendationItem[]
) {
  const recommendationMap = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    recommendationMap.set(item.id, item);
  });

  return [...recommendationMap.values()].sort((a, b) => {
    const periodComparison =
      new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime();

    if (periodComparison !== 0) {
      return periodComparison;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function RewardPunishmentManagement({
  initialRecommendations,
  units,
  defaultPeriod,
  role
}: RewardPunishmentManagementProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(
    initialRecommendations[0]?.id ?? ""
  );
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [confirmingRecommendation, setConfirmingRecommendation] =
    useState<RecommendationItem | null>(null);
  const [pendingGenerateValues, setPendingGenerateValues] =
    useState<RewardPunishmentGenerationValues | null>(null);
  const [pendingDecisionValues, setPendingDecisionValues] =
    useState<RewardPunishmentActionValues | null>(null);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [periodFilter, setPeriodFilter] = useState(defaultPeriod);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deletingRecommendationId, setDeletingRecommendationId] = useState<
    string | null
  >(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isDeciding, startDeciding] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const generateForm = useForm<
    RewardPunishmentGenerationInput,
    unknown,
    RewardPunishmentGenerationValues
  >({
    resolver: zodResolver(rewardPunishmentGenerationSchema),
    defaultValues: {
      period: defaultPeriod,
      rewardCategory: "Reward Bulanan",
      punishmentCategory: "Teguran Bulanan",
      notes: ""
    }
  });

  const actionForm = useForm<
    RewardPunishmentActionInput,
    unknown,
    RewardPunishmentActionValues
  >({
    resolver: zodResolver(rewardPunishmentActionSchema),
    defaultValues: {
      action: "APPROVE",
      category: "",
      notes: ""
    }
  });

  const selectedRecommendation =
    recommendations.find((item) => item.id === selectedRecommendationId) ?? null;

  useEffect(() => {
    if (!selectedRecommendation) {
      actionForm.reset({
        action: "APPROVE",
        category: "",
        notes: ""
      });
      return;
    }

    actionForm.reset({
      action: "APPROVE",
      category: selectedRecommendation.category,
      notes: selectedRecommendation.notes ?? ""
    });
  }, [actionForm, recommendations, selectedRecommendation]);

  const filteredRecommendations = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return recommendations.filter((item) => {
      if (
        normalizedSearch &&
        !`${item.officer.name} ${item.officer.nip}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (unitFilter !== "all" && item.officer.unit?.id !== unitFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      if (periodFilter && toMonthInputValue(item.periodStart) !== periodFilter) {
        return false;
      }

      return true;
    });
  }, [deferredSearch, periodFilter, recommendations, statusFilter, typeFilter, unitFilter]);

  const summary = useMemo(() => {
    return filteredRecommendations.reduce(
      (accumulator, item) => {
        accumulator.total += 1;
        accumulator[item.status] += 1;
        return accumulator;
      },
      {
        total: 0,
        RECOMMENDED: 0,
        APPROVED: 0,
        REJECTED: 0
      }
    );
  }, [filteredRecommendations]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecommendations.length / rowsPerPage)
  );
  const currentPage = Math.min(page, totalPages);
  const displayedRecommendations = filteredRecommendations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  async function onGenerate(values: RewardPunishmentGenerationValues) {
    startGenerating(async () => {
      const response = await fetch("/api/reward-punishment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const result = (await response.json()) as {
        message: string;
        data?: RecommendationItem[];
        meta?: {
          period: string;
          totalCandidates: number;
          createdCount: number;
          skippedCount: number;
        };
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal membuat rekomendasi.");
        return;
      }

      const nextRecommendations = result.data ?? [];

      if (nextRecommendations.length) {
        setRecommendations((current) =>
          mergeRecommendations(current, nextRecommendations)
        );
        setSelectedRecommendationId(nextRecommendations[0].id);
        setIsDetailDialogOpen(true);
      }

      toast.success(
        result.meta
          ? `${result.message || "Generate rekomendasi berhasil."} Kandidat: ${result.meta.totalCandidates}, dibuat: ${result.meta.createdCount}, dilewati: ${result.meta.skippedCount}.`
          : result.message || "Generate rekomendasi berhasil."
      );

      setIsGenerateDialogOpen(false);
    });
  }

  async function onDecision(values: RewardPunishmentActionValues) {
    if (!selectedRecommendation) {
      return;
    }

    startDeciding(async () => {
      const response = await fetch(
        `/api/reward-punishment/${selectedRecommendation.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        }
      );

      const result = (await response.json()) as {
        message: string;
        data?: RecommendationItem;
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal menyimpan keputusan.");
        return;
      }

      setRecommendations((current) =>
        current.map((item) => (item.id === result.data?.id ? result.data : item))
      );
      setSelectedRecommendationId(result.data.id);
      toast.success(result.message || "Keputusan berhasil disimpan.");
    });
  }

  async function deleteRecommendation(recommendation: RecommendationItem) {
    setDeletingRecommendationId(recommendation.id);

    try {
      const response = await fetch(`/api/reward-punishment/${recommendation.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus rekomendasi.");
        return;
      }

      setRecommendations((current) =>
        current.filter((item) => item.id !== recommendation.id)
      );

      if (selectedRecommendationId === recommendation.id) {
        setSelectedRecommendationId((currentId) => {
          if (currentId !== recommendation.id) {
            return currentId;
          }

          const nextRecommendation = recommendations.find(
            (item) => item.id !== recommendation.id
          );
          return nextRecommendation?.id ?? "";
        });
      }

      toast.success(result.message || "Rekomendasi berhasil dihapus.");
    } finally {
      setDeletingRecommendationId(null);
    }
  }

  return (
    <DashboardShell
      title="Reward dan Punishment"
      description="Generate rekomendasi bulanan berdasarkan rata-rata penilaian hadir, lalu putuskan approval atau reject secara manual. MVP ini tidak menerapkan minimum jumlah hari hadir, selama petugas punya minimal satu penilaian PRESENT pada bulan tersebut."
      role={role}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total rekomendasi" value={`${summary.total}`} icon={faWandSparkles} iconTone="sky" />
        <StatCard label="Recommended" value={`${summary.RECOMMENDED}`} icon={faTrophy} iconTone="teal" />
        <StatCard label="Approved" value={`${summary.APPROVED}`} icon={faCheck} iconTone="blue" />
        <StatCard label="Rejected" value={`${summary.REJECTED}`} icon={faTriangleExclamation} iconTone="soft" />
      </section>

      <section className="space-y-5">
        <FilterToolbar>
          <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FormField label="Cari petugas">
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama atau NIP"
                />
            </FormField>

            <FormField label="Periode">
                <Input
                  type="month"
                  value={periodFilter}
                  onChange={(event) => {
                    setPeriodFilter(event.target.value);
                    setPage(1);
                  }}
                />
            </FormField>

            <FormField label="Unit">
                <Select
                  value={unitFilter}
                  onChange={(event) => {
                    setUnitFilter(event.target.value);
                    setPage(1);
                  }}
                >
                <option value="all">Semua unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Tipe">
                <Select
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value as TypeFilter);
                    setPage(1);
                  }}
                >
                <option value="all">Semua tipe</option>
                <option value="REWARD">Reward</option>
                <option value="PUNISHMENT">Punishment</option>
              </Select>
            </FormField>

            <FormField label="Status">
                <Select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter);
                    setPage(1);
                  }}
                >
                <option value="all">Semua status</option>
                <option value="RECOMMENDED">Recommended</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </FormField>
          </div>

          <div className="flex items-end gap-3">
            <Button icon={faWandSparkles} onClick={() => setIsGenerateDialogOpen(true)}>
              Generate Rekomendasi
            </Button>
            <Button
              icon={faRotateLeft}
              variant="secondary"
              onClick={() => {
                setSearch("");
                setUnitFilter("all");
                setStatusFilter("all");
                setTypeFilter("all");
                setPeriodFilter(defaultPeriod);
                setPage(1);
              }}
            >
              Reset Filter
            </Button>
          </div>
        </FilterToolbar>

        <DataTableShell
          title="Daftar rekomendasi yang sudah ada"
          description={`${filteredRecommendations.length} rekomendasi sesuai filter aktif.`}
        >
          <Table
            headers={[
              "Periode",
              "Petugas",
              "Tipe",
              "Skor",
              "Kategori",
              "Status",
              "Aksi"
            ]}
          >
            {displayedRecommendations.length ? (
              displayedRecommendations.map((item) => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="px-5 py-4 font-medium">
                    {toMonthLabel(item.periodStart)}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold">{item.officer.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.officer.nip} · {item.officer.unit?.name ?? "Tanpa unit"}
                      </p>
                    </div>
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
                          onClick: () => {
                            setSelectedRecommendationId(item.id);
                            setIsDetailDialogOpen(true);
                          }
                        },
                        {
                          label:
                            deletingRecommendationId === item.id
                              ? "Menghapus..."
                              : "Hapus rekomendasi",
                          icon: faTrash,
                          variant: "danger",
                          disabled: deletingRecommendationId === item.id,
                          onClick: () => setConfirmingRecommendation(item)
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8">
                  <EmptyState
                    title={
                      recommendations.length
                        ? "Tidak ada rekomendasi untuk filter ini"
                        : "Belum ada rekomendasi yang dibuat"
                    }
                    description={
                      recommendations.length
                        ? "Ubah periode, status, tipe, atau unit agar data lain muncul."
                        : "Generate rekomendasi baru agar daftar reward dan punishment mulai terisi."
                    }
                    icon="RP"
                    actionLabel="Generate Rekomendasi"
                    onAction={() => setIsGenerateDialogOpen(true)}
                  />
                </td>
              </tr>
            )}
          </Table>
        </DataTableShell>

        {filteredRecommendations.length ? (
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecommendations.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(1);
            }}
          />
        ) : null}
      </section>

      <ModalDialog
        open={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        title="Generate rekomendasi"
        description="Sistem akan menghitung rata-rata skor bulanan dari assessment PRESENT saja. Petugas tanpa data hadir tidak akan dibuatkan rekomendasi."
      >
        <form
          className="space-y-4"
          onSubmit={generateForm.handleSubmit((values) => {
            setPendingGenerateValues(values);
          })}
        >
          <FormSection
            title="Parameter generate"
            description="Tentukan periode agregasi dan label kategori yang akan dipakai pada rekomendasi baru."
          >
            <FormField
              label="Periode bulanan"
              hint="Format bulan dipakai untuk agregasi penuh satu bulan."
              error={generateForm.formState.errors.period?.message}
            >
              <Input type="month" {...generateForm.register("period")} />
            </FormField>

            <FormField
              label="Kategori reward"
              error={generateForm.formState.errors.rewardCategory?.message}
            >
              <Input
                placeholder="Contoh: Reward Bulanan"
                {...generateForm.register("rewardCategory")}
              />
            </FormField>

            <FormField
              label="Kategori punishment"
              error={generateForm.formState.errors.punishmentCategory?.message}
            >
              <Input
                placeholder="Contoh: Teguran Bulanan"
                {...generateForm.register("punishmentCategory")}
              />
            </FormField>

            <FormField
              label="Catatan awal"
              hint="Opsional. Catatan ini akan disalin ke rekomendasi yang baru dibuat."
              error={generateForm.formState.errors.notes?.message}
            >
              <Textarea
                placeholder="Tulis catatan awal jika diperlukan"
                {...generateForm.register("notes")}
              />
            </FormField>
          </FormSection>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateDialogOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isGenerating} icon={faWandSparkles}>
              {isGenerating ? "Memproses..." : "Generate rekomendasi"}
            </Button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        title="Detail dan keputusan rekomendasi"
        description="Tinjau data rekomendasi yang sudah ada, lalu lakukan approve atau reject bila statusnya masih RECOMMENDED."
        className="max-w-4xl"
      >
        {selectedRecommendation ? (
          <>
            <SectionCard className="mb-4 space-y-4 border-none bg-[var(--surface)] p-4 shadow-none">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getTypeVariant(selectedRecommendation.type)}>
                      {getTypeLabel(selectedRecommendation.type)}
                    </Badge>
                    <Badge variant={getStatusVariant(selectedRecommendation.status)}>
                      {getStatusLabel(selectedRecommendation.status)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-lg font-bold">
                      {selectedRecommendation.officer.name}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      NIP {selectedRecommendation.officer.nip} ·{" "}
                      {selectedRecommendation.officer.unit?.name ?? "Tanpa unit"}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-[var(--radius-control)] bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Periode</p>
                      <p className="mt-1 font-semibold">
                        {toMonthLabel(selectedRecommendation.periodStart)}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-control)] bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Skor pemicu</p>
                      <p className="mt-1 font-semibold">
                        {formatAverageScore(selectedRecommendation.triggerScore)}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-control)] bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Kategori</p>
                      <p className="mt-1 font-semibold">
                        {selectedRecommendation.category}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-control)] bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Dibuat pada</p>
                      <p className="mt-1 font-semibold">
                        {toDateLabel(selectedRecommendation.createdAt)}
                      </p>
                    </div>
                  </div>

                  {selectedRecommendation.decidedBy ? (
                    <div className="rounded-[var(--radius-control)] bg-white px-4 py-3 text-sm">
                      <p className="text-[var(--muted)]">Keputusan terakhir</p>
                      <p className="mt-1 font-semibold">
                        {selectedRecommendation.decidedBy.name ?? "Pengguna"} ·{" "}
                        {selectedRecommendation.decidedBy.role}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        {selectedRecommendation.decidedAt
                          ? toDateLabel(selectedRecommendation.decidedAt)
                          : "-"}
                      </p>
                    </div>
                  ) : null}
            </SectionCard>

            <form
              className="space-y-4"
              onSubmit={actionForm.handleSubmit((values) => {
                setPendingDecisionValues(values);
              })}
            >
              <FormSection
                title="Keputusan akhir"
                description="Perbarui kategori atau catatan sebelum rekomendasi di-approve atau di-reject."
              >
                <FormField
                  label="Kategori final"
                  error={actionForm.formState.errors.category?.message}
                >
                  <Input
                    placeholder="Perbarui kategori jika diperlukan"
                    {...actionForm.register("category")}
                  />
                </FormField>

                <FormField
                  label="Catatan keputusan"
                  hint="Opsional, tetapi disarankan untuk approval atau reject."
                  error={actionForm.formState.errors.notes?.message}
                >
                  <Textarea
                    placeholder="Tulis alasan atau detail keputusan"
                    {...actionForm.register("notes")}
                  />
                </FormField>
              </FormSection>

              {selectedRecommendation.status === "RECOMMENDED" ? (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <Button
                    type="submit"
                    disabled={isDeciding}
                    onClick={() => actionForm.setValue("action", "APPROVE")}
                  >
                    {isDeciding ? "Menyimpan..." : "Approve rekomendasi"}
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    disabled={isDeciding}
                    onClick={() => actionForm.setValue("action", "REJECT")}
                  >
                    {isDeciding ? "Menyimpan..." : "Reject rekomendasi"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    Tutup
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
                    Rekomendasi ini sudah diputuskan. Buat rekomendasi baru pada
                    periode lain jika diperlukan tindak lanjut tambahan.
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsDetailDialogOpen(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </>
        ) : (
          <EmptyState
            title="Belum ada rekomendasi yang dipilih"
            description="Pilih salah satu baris di tabel untuk melihat detail dan melakukan approve atau reject."
            icon="RP"
          />
        )}
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingGenerateValues)}
        title="Generate rekomendasi baru?"
        description="Sistem akan membuat rekomendasi reward dan punishment untuk periode yang dipilih."
        variant="warning"
        icon={faWandSparkles}
        confirmLabel="Ya, generate"
        isLoading={isGenerating}
        onClose={() => {
          if (!isGenerating) {
            setPendingGenerateValues(null);
          }
        }}
        onConfirm={() => {
          if (pendingGenerateValues) {
            void onGenerate(pendingGenerateValues);
            setPendingGenerateValues(null);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDecisionValues)}
        title={
          pendingDecisionValues?.action === "REJECT"
            ? "Reject rekomendasi ini?"
            : "Approve rekomendasi ini?"
        }
        description="Keputusan akan langsung tercatat sebagai status akhir rekomendasi."
        variant={
          pendingDecisionValues?.action === "REJECT" ? "danger" : "success"
        }
        icon={
          pendingDecisionValues?.action === "REJECT"
            ? faTriangleExclamation
            : faCheck
        }
        confirmLabel={
          pendingDecisionValues?.action === "REJECT"
            ? "Ya, reject"
            : "Ya, approve"
        }
        isLoading={isDeciding}
        onClose={() => {
          if (!isDeciding) {
            setPendingDecisionValues(null);
          }
        }}
        onConfirm={() => {
          if (pendingDecisionValues) {
            void onDecision(pendingDecisionValues);
            setPendingDecisionValues(null);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmingRecommendation)}
        title={
          confirmingRecommendation
            ? `Hapus rekomendasi ${confirmingRecommendation.officer.name}?`
            : "Hapus rekomendasi?"
        }
        description="Rekomendasi yang dihapus tidak bisa dipulihkan lagi."
        isLoading={
          Boolean(confirmingRecommendation) &&
          deletingRecommendationId === confirmingRecommendation?.id
        }
        onClose={() => {
          if (!deletingRecommendationId) {
            setConfirmingRecommendation(null);
          }
        }}
        onConfirm={() => {
          if (confirmingRecommendation) {
            void deleteRecommendation(confirmingRecommendation).finally(() =>
              setConfirmingRecommendation(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
