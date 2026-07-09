"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import {
  faCheck,
  faGavel,
  faRotateLeft,
  faTrash,
  faTriangleExclamation,
  faTrophy,
  faWandSparkles
} from "@fortawesome/free-solid-svg-icons";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecommendationDetailDialog } from "@/components/reward-punishment/recommendation-detail-dialog";
import { RecommendationGenerateDialog } from "@/components/reward-punishment/recommendation-generate-dialog";
import { RecommendationListSection } from "@/components/reward-punishment/recommendation-list-section";
import { FormField } from "@/components/forms/form-field";
import { AccentSummaryPanel } from "@/components/ui/accent-summary-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { applyServerFormErrors, getApiErrorMessage } from "@/lib/form-api";
import type { PaginatedData } from "@/lib/pagination";
import {
  getRewardPunishmentTypeLabel,
} from "@/lib/reward-punishment";
import {
  getDefaultTimePreset,
  getTimePresetRange,
  type TimePreset
} from "@/lib/time-presets";
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
  type: "EVALUASI" | "REWARD" | "PUNISHMENT";
  periodKind:
    | "DAILY"
    | "WORKWEEK"
    | "MONTHLY"
    | "QUARTERLY"
    | "SEMIANNUAL"
    | "YEARLY";
  referenceDate: string | Date;
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
  initialRecommendations: PaginatedData<RecommendationItem> & {
    summary: {
      total: number;
      RECOMMENDED: number;
      APPROVED: number;
      REJECTED: number;
    };
  };
  units: UnitOption[];
  defaultReferenceDate: string;
  role: string;
};

type StatusFilter = "all" | "RECOMMENDED" | "APPROVED" | "REJECTED";
type TypeFilter = "all" | "EVALUASI" | "REWARD" | "PUNISHMENT";

function toDateLabel(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
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
    return "Disetujui";
  }

  if (status === "REJECTED") {
    return "Ditolak";
  }

  return "Menunggu keputusan";
}

function getTypeVariant(type: RecommendationItem["type"]) {
  if (type === "EVALUASI") {
    return "default";
  }

  return type === "REWARD" ? "success" : "danger";
}

function getTypeLabel(type: RecommendationItem["type"]) {
  return getRewardPunishmentTypeLabel(type);
}

export function RewardPunishmentManagement({
  initialRecommendations,
  units,
  defaultReferenceDate,
  role
}: RewardPunishmentManagementProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations.data);
  const [summary, setSummary] = useState(initialRecommendations.summary);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(
    initialRecommendations.data[0]?.id ?? ""
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
  const [timePreset, setTimePreset] = useState<TimePreset>(getDefaultTimePreset());
  const [page, setPage] = useState(initialRecommendations.meta.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialRecommendations.meta.rowsPerPage);
  const [totalItems, setTotalItems] = useState(initialRecommendations.meta.totalItems);
  const [deletingRecommendationId, setDeletingRecommendationId] = useState<
    string | null
  >(null);
  const generateForm = useForm<
    RewardPunishmentGenerationInput,
    unknown,
    RewardPunishmentGenerationValues
  >({
    resolver: zodResolver(rewardPunishmentGenerationSchema),
    defaultValues: {
      periodKind: "MONTHLY",
      referenceDate: defaultReferenceDate,
      generationMode: "REWARD_PUNISHMENT",
      evaluationCategory: "Evaluasi Berkala",
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

  const [isGenerating, startGenerating] = useTransition();
  const [isDeciding, startDeciding] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const hasMountedRef = useRef(false);
  const generationMode = useWatch({
    control: generateForm.control,
    name: "generationMode"
  });
  const { from: fromDate, to: toDate } = getTimePresetRange(timePreset);
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const selectedRecommendation =
    recommendations.find((item) => item.id === selectedRecommendationId) ?? null;

  const loadRecommendations = useCallback(async (
    overrides?: Partial<{
      search: string;
      unitFilter: string;
      statusFilter: StatusFilter;
      typeFilter: TypeFilter;
      page: number;
      rowsPerPage: number;
      fromDate: string;
      toDate: string;
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
      type:
        (overrides?.typeFilter ?? typeFilter) === "all"
          ? ""
          : (overrides?.typeFilter ?? typeFilter),
      from: overrides?.fromDate ?? fromDate,
      to: overrides?.toDate ?? toDate,
      page: String(overrides?.page ?? page),
      rowsPerPage: String(overrides?.rowsPerPage ?? rowsPerPage)
    });
    const response = await fetch(`/api/reward-punishment?${params.toString()}`);
    const result = (await response.json()) as {
      message?: string;
      data?: RecommendationItem[];
      meta?: PaginatedData<RecommendationItem>["meta"];
      summary?: typeof summary;
    };

    if (!response.ok || !result.data || !result.meta || !result.summary) {
      toast.error(getApiErrorMessage(result, "Gagal memuat daftar evaluasi."));
      return;
    }

    const nextData = result.data;
    const nextMeta = result.meta;
    const nextSummary = result.summary;

    setRecommendations(nextData);
    setSummary({
      total: nextMeta.totalItems,
      RECOMMENDED: nextSummary.RECOMMENDED,
      APPROVED: nextSummary.APPROVED,
      REJECTED: nextSummary.REJECTED
    });
    setPage(nextMeta.page);
    setRowsPerPage(nextMeta.rowsPerPage);
    setTotalItems(nextMeta.totalItems);
    setSelectedRecommendationId((currentId) => {
      if (nextData.some((item) => item.id === currentId)) {
        return currentId;
      }

      return nextData[0]?.id ?? "";
    });
  }, [deferredSearch, fromDate, page, rowsPerPage, statusFilter, toDate, typeFilter, unitFilter]);

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

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void loadRecommendations();
  }, [deferredSearch, fromDate, loadRecommendations, page, rowsPerPage, statusFilter, toDate, typeFilter, unitFilter]);

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
        errors?: Record<string, string[] | undefined>;
        meta?: {
          periodKind: RecommendationItem["periodKind"];
          referenceDate: string;
          generationMode:
            | "EVALUASI"
            | "REWARD"
            | "PUNISHMENT"
            | "REWARD_PUNISHMENT";
          totalCandidates: number;
          createdCount: number;
          skippedCount: number;
        };
      };

      if (!response.ok) {
        applyServerFormErrors(generateForm.setError, result.errors);
        toast.error(
          getApiErrorMessage(
            result,
            "Gagal membuat data evaluasi, reward, dan punishment. Periksa kembali parameter generate."
          )
        );
        return;
      }

      const nextRecommendations = result.data ?? [];

      if (nextRecommendations.length) {
        setSelectedRecommendationId(nextRecommendations[0].id);
        setIsDetailDialogOpen(true);
      }

      toast.success(
        result.meta
          ? `${result.message || "Generate data berhasil."} Kandidat: ${result.meta.totalCandidates}, dibuat: ${result.meta.createdCount}, dilewati: ${result.meta.skippedCount}.`
          : result.message || "Generate data berhasil."
      );

      await loadRecommendations({ page: 1 });
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
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(actionForm.setError, result.errors);
        toast.error(
          getApiErrorMessage(
            result,
            "Gagal menyimpan keputusan. Periksa kembali kategori dan catatan keputusan."
          )
        );
        return;
      }

      await loadRecommendations();
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
        toast.error(result.message || "Gagal menghapus data.");
        return;
      }

      const nextPage = recommendations.length === 1 && page > 1 ? page - 1 : page;
      await loadRecommendations({ page: nextPage });

      toast.success(result.message || "Data berhasil dihapus.");
    } finally {
      setDeletingRecommendationId(null);
    }
  }

  return (
    <DashboardShell
      title="Evaluasi, Reward, dan Punishment"
      description="Generate evaluasi netral maupun tindak lanjut reward dan punishment berdasarkan penilaian hadir pada periode yang dipilih, lalu putuskan hasilnya secara manual."
      role={role}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total data" value={`${summary.total}`} icon={faWandSparkles} iconTone="sky" />
        <StatCard label="Menunggu keputusan" value={`${summary.RECOMMENDED}`} icon={faTrophy} iconTone="teal" />
        <StatCard label="Disetujui" value={`${summary.APPROVED}`} icon={faCheck} iconTone="blue" />
        <StatCard label="Ditolak" value={`${summary.REJECTED}`} icon={faTriangleExclamation} iconTone="soft" />
      </section>

      <RecommendationListSection
        summary={summary}
        search={search}
        unitFilter={unitFilter}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        timePreset={timePreset}
        units={units}
        recommendations={recommendations}
        totalItems={totalItems}
        currentPage={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        deletingRecommendationId={deletingRecommendationId}
        hasSeedData={Boolean(search || unitFilter !== "all" || statusFilter !== "all" || typeFilter !== "all" || totalItems > 0 || timePreset !== getDefaultTimePreset())}
        getTypeVariant={getTypeVariant}
        getTypeLabel={getTypeLabel}
        getStatusVariant={getStatusVariant}
        getStatusLabel={getStatusLabel}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onUnitChange={(value) => {
          setUnitFilter(value);
          setPage(1);
        }}
        onTypeChange={(value) => {
          setTypeFilter(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onTimePresetChange={(value) => {
          setTimePreset(value);
          setPage(1);
        }}
        onResetFilters={() => {
          setSearch("");
          setUnitFilter("all");
          setStatusFilter("all");
          setTypeFilter("all");
          setTimePreset(getDefaultTimePreset());
          setPage(1);
        }}
        onOpenGenerate={() => setIsGenerateDialogOpen(true)}
        onOpenDetail={(recommendationId) => {
          setSelectedRecommendationId(recommendationId);
          setIsDetailDialogOpen(true);
        }}
        onDelete={(recommendationId) => {
          const recommendation = recommendations.find((item) => item.id === recommendationId);
          if (recommendation) {
            setConfirmingRecommendation(recommendation);
          }
        }}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(1);
        }}
      />

      <RecommendationGenerateDialog
        open={isGenerateDialogOpen}
        form={generateForm}
        generationMode={generationMode}
        isGenerating={isGenerating}
        onClose={() => setIsGenerateDialogOpen(false)}
        onSubmit={(values) => {
          setPendingGenerateValues(values);
        }}
      />

      <RecommendationDetailDialog
        open={isDetailDialogOpen}
        recommendation={selectedRecommendation}
        form={actionForm}
        isDeciding={isDeciding}
        getTypeVariant={getTypeVariant}
        getTypeLabel={getTypeLabel}
        getStatusVariant={getStatusVariant}
        getStatusLabel={getStatusLabel}
        toDateLabel={toDateLabel}
        onClose={() => setIsDetailDialogOpen(false)}
        onSubmit={(values) => {
          setPendingDecisionValues(values);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingGenerateValues)}
        title="Generate data baru?"
        description="Sistem akan membuat evaluasi, reward, atau punishment untuk periode yang dipilih."
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
            ? "Tolak data ini?"
            : "Setujui data ini?"
        }
        description="Keputusan akan langsung tercatat sebagai status akhir data ini."
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
            ? "Ya, tolak"
            : "Ya, setujui"
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
            ? `Hapus data ${confirmingRecommendation.officer.name}?`
            : "Hapus data?"
        }
        description="Data yang dihapus tidak bisa dipulihkan lagi."
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
