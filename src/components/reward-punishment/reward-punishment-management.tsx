"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SuccessFeedback } from "@/components/ui/success-feedback";
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
  userName,
  role
}: RewardPunishmentManagementProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(
    initialRecommendations[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [periodFilter, setPeriodFilter] = useState(defaultPeriod);
  const [generateFeedback, setGenerateFeedback] = useState("");
  const [generateDescription, setGenerateDescription] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState("");
  const [decisionError, setDecisionError] = useState("");
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

  async function onGenerate(values: RewardPunishmentGenerationValues) {
    setGenerateError("");
    setGenerateFeedback("");
    setGenerateDescription("");

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
        setGenerateError(result.message || "Gagal membuat rekomendasi.");
        return;
      }

      const nextRecommendations = result.data ?? [];

      if (nextRecommendations.length) {
        setRecommendations((current) =>
          mergeRecommendations(current, nextRecommendations)
        );
        setSelectedRecommendationId(nextRecommendations[0].id);
      }

      setGenerateFeedback(result.message || "Generate rekomendasi berhasil.");

      if (result.meta) {
        setGenerateDescription(
          `Kandidat: ${result.meta.totalCandidates}, dibuat: ${result.meta.createdCount}, dilewati: ${result.meta.skippedCount}.`
        );
      }
    });
  }

  async function onDecision(values: RewardPunishmentActionValues) {
    if (!selectedRecommendation) {
      return;
    }

    setDecisionError("");
    setDecisionFeedback("");

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
        setDecisionError(result.message || "Gagal menyimpan keputusan.");
        return;
      }

      setRecommendations((current) =>
        current.map((item) => (item.id === result.data?.id ? result.data : item))
      );
      setDecisionFeedback(result.message || "Keputusan berhasil disimpan.");
    });
  }

  return (
    <DashboardShell
      title="Reward dan Punishment"
      description="Generate rekomendasi bulanan berdasarkan rata-rata penilaian hadir, lalu putuskan approval atau reject secara manual. MVP ini tidak menerapkan minimum jumlah hari hadir, selama petugas punya minimal satu penilaian PRESENT pada bulan tersebut."
      userName={userName}
      role={role}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Total rekomendasi</p>
          <p className="mt-2 text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Recommended</p>
          <p className="mt-2 text-2xl font-bold">{summary.RECOMMENDED}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Approved</p>
          <p className="mt-2 text-2xl font-bold">{summary.APPROVED}</p>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Rejected</p>
          <p className="mt-2 text-2xl font-bold">{summary.REJECTED}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="grid gap-4 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-5">
            <FormField label="Cari petugas">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau NIP"
              />
            </FormField>

            <FormField label="Periode">
              <Input
                type="month"
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value)}
              />
            </FormField>

            <FormField label="Unit">
              <Select
                value={unitFilter}
                onChange={(event) => setUnitFilter(event.target.value)}
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
                onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              >
                <option value="all">Semua tipe</option>
                <option value="REWARD">Reward</option>
                <option value="PUNISHMENT">Punishment</option>
              </Select>
            </FormField>

            <FormField label="Status">
              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="all">Semua status</option>
                <option value="RECOMMENDED">Recommended</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </FormField>
          </div>

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
            {filteredRecommendations.length ? (
              filteredRecommendations.map((item) => (
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
                    <Button
                      size="sm"
                      variant={
                        item.id === selectedRecommendationId ? "primary" : "secondary"
                      }
                      onClick={() => {
                        setSelectedRecommendationId(item.id);
                        setDecisionError("");
                        setDecisionFeedback("");
                      }}
                    >
                      {item.id === selectedRecommendationId ? "Dipilih" : "Lihat"}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8">
                  <EmptyState
                    title="Belum ada rekomendasi pada filter ini"
                    description="Generate rekomendasi untuk periode yang dipilih atau ubah filter pencarian agar data lain muncul."
                    icon="RP"
                  />
                </td>
              </tr>
            )}
          </Table>
        </div>

        <div className="space-y-5">
          <Dialog
            title="Generate rekomendasi"
            description="Sistem akan menghitung rata-rata skor bulanan dari assessment PRESENT saja. Petugas tanpa data hadir tidak akan dibuatkan rekomendasi."
          >
            {generateFeedback ? (
              <div className="mb-4">
                <SuccessFeedback
                  title={generateFeedback}
                  description={generateDescription}
                />
              </div>
            ) : null}

            {generateError ? (
              <div className="mb-4 rounded-2xl border border-[#f4c7c3] bg-[#fff5f4] px-4 py-3 text-sm text-[#8f261c]">
                {generateError}
              </div>
            ) : null}

            <form
              className="space-y-4"
              onSubmit={generateForm.handleSubmit(onGenerate)}
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

              <Button className="w-full" type="submit" disabled={isGenerating}>
                {isGenerating ? "Memproses..." : "Generate rekomendasi"}
              </Button>
            </form>
          </Dialog>

          <Dialog
            title="Detail dan keputusan"
            description="Pilih satu rekomendasi dari tabel untuk melihat detail skor pemicu dan memberikan keputusan akhir."
          >
            {selectedRecommendation ? (
              <>
                <div className="mb-4 space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
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
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Periode</p>
                      <p className="mt-1 font-semibold">
                        {toMonthLabel(selectedRecommendation.periodStart)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Skor pemicu</p>
                      <p className="mt-1 font-semibold">
                        {formatAverageScore(selectedRecommendation.triggerScore)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Kategori</p>
                      <p className="mt-1 font-semibold">
                        {selectedRecommendation.category}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[var(--muted)]">Dibuat pada</p>
                      <p className="mt-1 font-semibold">
                        {toDateLabel(selectedRecommendation.createdAt)}
                      </p>
                    </div>
                  </div>

                  {selectedRecommendation.decidedBy ? (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm">
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
                </div>

                {decisionFeedback ? (
                  <div className="mb-4">
                    <SuccessFeedback title={decisionFeedback} />
                  </div>
                ) : null}

                {decisionError ? (
                  <div className="mb-4 rounded-2xl border border-[#f4c7c3] bg-[#fff5f4] px-4 py-3 text-sm text-[#8f261c]">
                    {decisionError}
                  </div>
                ) : null}

                <form
                  className="space-y-4"
                  onSubmit={actionForm.handleSubmit(onDecision)}
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

                  {selectedRecommendation.status === "RECOMMENDED" ? (
                    <div className="grid gap-3 md:grid-cols-2">
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
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
                      Rekomendasi ini sudah diputuskan. Buat rekomendasi baru pada
                      periode lain jika diperlukan tindak lanjut tambahan.
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
          </Dialog>
        </div>
      </section>
    </DashboardShell>
  );
}
