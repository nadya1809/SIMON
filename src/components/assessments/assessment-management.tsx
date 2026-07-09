"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import {
  faPenToSquare,
  faPlus,
  faRotateLeft,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AssessmentFormDialog } from "@/components/assessments/assessment-form-dialog";
import { AssessmentListSection } from "@/components/assessments/assessment-list-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { applyServerFormErrors, getApiErrorMessage } from "@/lib/form-api";
import {
  type AssessmentListItem,
  type AssessmentListResult
} from "@/lib/assessments";
import {
  formatDateOnlyUtc,
  getTodayDateInputValue
} from "@/lib/date-only";
import {
  getDefaultTimePreset,
  getTimePresetRange,
  type TimePreset
} from "@/lib/time-presets";
import { calculateAverageScore, formatAverageScore } from "@/lib/scoring";
import {
  assessmentSchema,
  type AssessmentFormInput,
  type AssessmentFormValues
} from "@/lib/validations/assessment";

type OfficerOption = {
  id: string;
  name: string;
  nip: string;
  unitId: string | null;
  unit: { id: string; name: string } | null;
};

type CriteriaOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type AssessmentItem = AssessmentListItem;

type AssessmentManagementProps = {
  initialAssessmentData: AssessmentListResult;
  officers: OfficerOption[];
  criteria: CriteriaOption[];
  userName: string;
  role: string;
};

type StatusFilter = "all" | "PRESENT" | "ABSENT";

type AssessmentScoreInput = {
  criteriaId: string;
  score: number | "";
};

function createDefaultScores(criteria: CriteriaOption[]) {
  return criteria.map((item) => ({
    criteriaId: item.id,
    score: ""
  }));
}

function getOfficerDisplayLabel(officer: Pick<OfficerOption, "name" | "nip">) {
  return `${officer.name} (${officer.nip})`;
}

async function requestAssessmentList(
  params: {
    search: string;
    unitId: string;
    status: StatusFilter;
    from: string;
    to: string;
    page: number;
    rowsPerPage: number;
  },
  signal?: AbortSignal
) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("q", params.search);
  }

  if (params.unitId !== "all") {
    searchParams.set("unitId", params.unitId);
  }

  if (params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params.from) {
    searchParams.set("from", params.from);
  }

  if (params.to) {
    searchParams.set("to", params.to);
  }

  searchParams.set("page", String(params.page));
  searchParams.set("rowsPerPage", String(params.rowsPerPage));

  const response = await fetch(`/api/assessments?${searchParams.toString()}`, {
    signal,
    cache: "no-store"
  });

  const result = (await response.json()) as {
    message?: string;
    data?: AssessmentListResult;
  };

  if (!response.ok || !result.data) {
    throw new Error(
      getApiErrorMessage(result, "Gagal memuat riwayat penilaian.")
    );
  }

  return result.data;
}

export function AssessmentManagement({
  initialAssessmentData,
  officers,
  criteria,
  role
}: AssessmentManagementProps) {
  const [assessments, setAssessments] = useState(initialAssessmentData.items);
  const [pagination, setPagination] = useState(initialAssessmentData.meta);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentItem | null>(null);
  const [pendingSubmitValues, setPendingSubmitValues] =
    useState<AssessmentFormValues | null>(null);
  const [confirmingAssessment, setConfirmingAssessment] =
    useState<AssessmentItem | null>(null);
  const [statusValue, setStatusValue] = useState<"PRESENT" | "ABSENT">(
    "PRESENT"
  );
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(
    null
  );
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [officerPickerQuery, setOfficerPickerQuery] = useState("");
  const [searchOfficer, setSearchOfficer] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timePreset, setTimePreset] = useState<TimePreset>(getDefaultTimePreset());
  const [page, setPage] = useState(initialAssessmentData.meta.page);
  const [rowsPerPage, setRowsPerPage] = useState(
    initialAssessmentData.meta.rowsPerPage
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasMountedRef = useRef(false);
  const deferredSearch = useDeferredValue(searchOfficer);
  const { from: fromDate, to: toDate } = getTimePresetRange(timePreset);

  const units = useMemo(() => {
    const unitMap = new Map<string, { id: string; name: string }>();

    officers.forEach((officer) => {
      if (officer.unit) {
        unitMap.set(officer.unit.id, officer.unit);
      }
    });

    return [...unitMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [officers]);

  const form = useForm<AssessmentFormInput, unknown, AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      officerId: "",
      assessmentDate: getTodayDateInputValue(),
      status: "PRESENT",
      notes: "",
      scores: createDefaultScores(criteria)
    }
  });

  const { register, handleSubmit, reset, formState, setValue, control, setError } = form;
  const watchedScores = useWatch({
    control,
    name: "scores"
  });
  const validLiveScores = (watchedScores ?? [])
    .map((item) => Number(item?.score))
    .filter((score) => Number.isFinite(score) && score >= 1 && score <= 100);
  const liveAverageScore =
    statusValue === "PRESENT" && validLiveScores.length === criteria.length
      ? calculateAverageScore(validLiveScores)
      : null;

  const hasActiveFilters =
    deferredSearch.trim().length > 0 ||
    unitFilter !== "all" ||
    statusFilter !== "all" ||
    timePreset !== getDefaultTimePreset();

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const controller = new AbortController();

    setIsListLoading(true);

    void requestAssessmentList(
      {
        search: deferredSearch.trim(),
        unitId: unitFilter,
        status: statusFilter,
        from: fromDate,
        to: toDate,
        page,
        rowsPerPage
      },
      controller.signal
    )
      .then((result) => {
        setAssessments(result.items);
        setPagination(result.meta);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Gagal memuat riwayat penilaian.";
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsListLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    deferredSearch,
    unitFilter,
    statusFilter,
    fromDate,
    toDate,
    page,
    rowsPerPage,
    refreshKey
  ]);

  function resetForm() {
    setIsFormDialogOpen(false);
    setEditingAssessment(null);
    setStatusValue("PRESENT");
    setSelectedOfficerId("");
    setOfficerPickerQuery("");
    reset({
      officerId: "",
      assessmentDate: getTodayDateInputValue(),
      status: "PRESENT",
      notes: "",
      scores: createDefaultScores(criteria)
    });
  }

  function startEditMode(assessment: AssessmentItem) {
    setIsFormDialogOpen(true);
    setEditingAssessment(assessment);
    setStatusValue(assessment.status);
    setSelectedOfficerId(assessment.officerId);
    setOfficerPickerQuery(getOfficerDisplayLabel(assessment.officer));
    reset({
      officerId: assessment.officerId,
      assessmentDate: formatDateOnlyUtc(assessment.assessmentDate),
      status: assessment.status,
      notes: assessment.notes ?? "",
      scores: criteria.map((item) => ({
        criteriaId: item.id,
        score:
          assessment.scores.find((score) => score.criteria.id === item.id)
            ?.score ?? ""
      }))
    });
  }

  const normalizedOfficerPickerQuery = officerPickerQuery.trim().toLowerCase();
  const displayedOfficerOptions = officers
    .filter((officer) => {
      if (!normalizedOfficerPickerQuery) {
        return true;
      }

      return `${officer.name} ${officer.nip}`
        .toLowerCase()
        .includes(normalizedOfficerPickerQuery);
    })
    .slice(0, normalizedOfficerPickerQuery ? 8 : 6);

  async function onSubmit(values: AssessmentFormValues) {
    const payload = {
      ...values,
      notes: values.notes?.trim() || "",
      scores:
        values.status === "ABSENT"
          ? []
          : values.scores.map((item) => ({
              criteriaId: item.criteriaId,
              score: Number(item.score)
            }))
    };

    const endpoint = editingAssessment
      ? `/api/assessments/${editingAssessment.id}`
      : "/api/assessments";
    const method = editingAssessment ? "PATCH" : "POST";

    startTransition(async () => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as {
        message: string;
        data?: AssessmentItem;
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(setError, result.errors);
        toast.error(
          getApiErrorMessage(
            result,
            editingAssessment
              ? "Gagal memperbarui penilaian. Periksa petugas, tanggal, status, dan skor."
              : "Gagal menambahkan penilaian. Periksa petugas, tanggal, status, dan skor."
          )
        );
        return;
      }

      const nextAssessment = result.data;

      if (editingAssessment) {
        toast.success(
          result.message ||
            `Penilaian ${nextAssessment.officer.name} berhasil diperbarui.`
        );
      } else {
        toast.success(
          result.message ||
            `Penilaian harian untuk ${nextAssessment.officer.name} berhasil ditambahkan.`
        );
      }

      resetForm();

      if (!editingAssessment && page !== 1) {
        setPage(1);
      } else {
        setRefreshKey((current) => current + 1);
      }
    });
  }

  async function deleteAssessment(assessment: AssessmentItem) {
    setDeletingAssessmentId(assessment.id);

    try {
      const response = await fetch(`/api/assessments/${assessment.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus penilaian.");
        return;
      }

      if (editingAssessment?.id === assessment.id) {
        resetForm();
      }

      toast.success(result.message || "Penilaian berhasil dihapus.");
      setRefreshKey((current) => current + 1);
    } finally {
      setDeletingAssessmentId(null);
    }
  }

  const activeOfficer = officers.find((item) => item.id === selectedOfficerId);

  function selectOfficer(officer: OfficerOption) {
    setSelectedOfficerId(officer.id);
    setOfficerPickerQuery(getOfficerDisplayLabel(officer));
    setValue("officerId", officer.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }

  return (
    <DashboardShell
      title="Penilaian Harian"
      description="Input dan pantau penilaian harian petugas PST. Status tidak hadir tetap harus dicatat agar kepatuhan pengisian harian tetap akurat."
      role={role}
    >
      <AssessmentListSection
        searchOfficer={searchOfficer}
        unitFilter={unitFilter}
        statusFilter={statusFilter}
        timePreset={timePreset}
        units={units}
        assessments={assessments}
        pagination={pagination}
        rowsPerPage={rowsPerPage}
        hasActiveFilters={hasActiveFilters}
        isListLoading={isListLoading}
        deletingAssessmentId={deletingAssessmentId}
        onSearchChange={(value) => {
          setSearchOfficer(value);
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
        onTimePresetChange={(value) => {
          setTimePreset(value);
          setPage(1);
        }}
        onResetFilters={() => {
          setSearchOfficer("");
          setUnitFilter("all");
          setStatusFilter("all");
          setTimePreset(getDefaultTimePreset());
          setPage(1);
        }}
        onOpenCreate={() => {
          resetForm();
          setIsFormDialogOpen(true);
        }}
        onEdit={(assessmentId) => {
          const assessment = assessments.find((item) => item.id === assessmentId);
          if (assessment) {
            startEditMode(assessment);
          }
        }}
        onDelete={(assessmentId) => {
          const assessment = assessments.find((item) => item.id === assessmentId);
          if (assessment) {
            setConfirmingAssessment(assessment);
          }
        }}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(1);
        }}
      />

      <AssessmentFormDialog
        open={isFormDialogOpen}
        editingAssessment={Boolean(editingAssessment)}
        form={form}
        criteria={criteria}
        displayedOfficerOptions={displayedOfficerOptions}
        selectedOfficerId={selectedOfficerId}
        officerPickerQuery={officerPickerQuery}
        activeOfficer={activeOfficer}
        statusValue={statusValue}
        liveAverageScore={liveAverageScore}
        isPending={isPending}
        onClose={resetForm}
        onOfficerQueryChange={setOfficerPickerQuery}
        onSelectOfficer={(officerId) => {
          const officer = officers.find((item) => item.id === officerId);
          if (officer) {
            selectOfficer(officer);
          }
        }}
        onStatusValueChange={setStatusValue}
        onSubmit={(values) => {
          setPendingSubmitValues(values);
        }}
        getOfficerDisplayLabel={getOfficerDisplayLabel}
      />

      <ConfirmDialog
        open={Boolean(pendingSubmitValues)}
        title={
          editingAssessment
            ? "Simpan perubahan penilaian?"
            : "Simpan penilaian harian?"
        }
        description={
          editingAssessment
            ? "Perubahan penilaian akan langsung memperbarui rekap dan laporan."
            : "Penilaian baru akan langsung masuk ke dashboard dan laporan."
        }
        variant="primary"
        icon={editingAssessment ? faPenToSquare : faPlus}
        confirmLabel="Ya, simpan"
        isLoading={isPending}
        onClose={() => {
          if (!isPending) {
            setPendingSubmitValues(null);
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
        open={Boolean(confirmingAssessment)}
        title={
          confirmingAssessment
            ? `Hapus penilaian ${confirmingAssessment.officer.name}?`
            : "Hapus penilaian?"
        }
        description="Data penilaian harian yang dihapus tidak bisa dipulihkan lagi."
        isLoading={
          Boolean(confirmingAssessment) &&
          deletingAssessmentId === confirmingAssessment?.id
        }
        onClose={() => {
          if (!deletingAssessmentId) {
            setConfirmingAssessment(null);
          }
        }}
        onConfirm={() => {
          if (confirmingAssessment) {
            void deleteAssessment(confirmingAssessment).finally(() =>
              setConfirmingAssessment(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
