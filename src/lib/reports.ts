import { prisma } from "@/lib/prisma";
import { parseDateOnlyUtc } from "@/lib/date-only";
import {
  createPaginationMeta,
  resolvePaginationParams
} from "@/lib/pagination";
import { getTimePresetRange, resolveTimePreset } from "@/lib/time-presets";

type ReportParams = {
  search?: string;
  timePreset?: string;
  from?: string;
  to?: string;
  unitId?: string;
  officerId?: string;
  rankingPage?: string;
  rankingRowsPerPage?: string;
  previewPage?: string;
  previewRowsPerPage?: string;
  includeAllRows?: boolean;
};

export type ReportRow = {
  id: string;
  assessmentDate: Date;
  status: "PRESENT" | "ABSENT";
  officerId: string;
  officerName: string;
  officerNip: string;
  unitName: string;
  averageScore: number | null;
  criteriaScores: Array<{
    criteriaId: string;
    criteriaName: string;
    score: number | null;
  }>;
  relatedRecommendationLabels: string[];
};

export type GroupedReportMonth = {
  monthKey: string;
  monthLabel: string;
  totalTasks: number;
  presentTaskCount: number;
  averageScore: number | null;
  details: ReportRow[];
};

export type GroupedReportYear = {
  yearKey: string;
  yearLabel: string;
  totalTasks: number;
  presentTaskCount: number;
  averageScore: number | null;
  months: GroupedReportMonth[];
};

export type GroupedReportOfficer = {
  officerId: string;
  officerName: string;
  officerNip: string;
  unitName: string;
  totalTasks: number;
  presentTaskCount: number;
  averageScore: number | null;
  years: GroupedReportYear[];
};

export type ReportCriteriaAverage = {
  criteriaId: string;
  criteriaName: string;
  averageScore: number | null;
};

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function averageNullable(values: Array<number | null>) {
  const filteredValues = values.filter(
    (value): value is number => typeof value === "number"
  );

  if (!filteredValues.length) {
    return null;
  }

  const total = filteredValues.reduce((sum, value) => sum + value, 0);
  return Number((total / filteredValues.length).toFixed(2));
}

function toMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(value);
}

function toYearLabel(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    timeZone: "UTC"
  }).format(value);
}

export function buildGroupedReport(rows: ReportRow[]): GroupedReportOfficer[] {
  const officerMap = new Map<
    string,
    {
      officerId: string;
      officerName: string;
      officerNip: string;
      unitName: string;
      details: ReportRow[];
    }
  >();

  rows.forEach((row) => {
    const existingOfficer = officerMap.get(row.officerId);

    if (existingOfficer) {
      existingOfficer.details.push(row);
      return;
    }

    officerMap.set(row.officerId, {
      officerId: row.officerId,
      officerName: row.officerName,
      officerNip: row.officerNip,
      unitName: row.unitName,
      details: [row]
    });
  });

  return Array.from(officerMap.values())
    .sort((left, right) =>
      left.officerName.localeCompare(right.officerName, "id-ID")
    )
    .map((officer) => {
      const yearMap = new Map<string, ReportRow[]>();

      officer.details
        .slice()
        .sort(
          (left, right) =>
            left.assessmentDate.getTime() - right.assessmentDate.getTime()
        )
        .forEach((row) => {
          const yearKey = `${row.assessmentDate.getUTCFullYear()}`;
          const yearGroup = yearMap.get(yearKey);

          if (yearGroup) {
            yearGroup.push(row);
            return;
          }

          yearMap.set(yearKey, [row]);
        });

      const years = Array.from(yearMap.entries())
        .sort(([leftYear], [rightYear]) => Number(leftYear) - Number(rightYear))
        .map(([yearKey, yearRows]) => {
          const monthMap = new Map<string, ReportRow[]>();

          yearRows.forEach((row) => {
            const monthKey = `${row.assessmentDate.getUTCFullYear()}-${`${row.assessmentDate.getUTCMonth() + 1}`.padStart(2, "0")}`;
            const monthGroup = monthMap.get(monthKey);

            if (monthGroup) {
              monthGroup.push(row);
              return;
            }

            monthMap.set(monthKey, [row]);
          });

          const months = Array.from(monthMap.entries())
            .sort(([leftMonth], [rightMonth]) =>
              leftMonth.localeCompare(rightMonth)
            )
            .map(([monthKey, monthRows]) => {
              const sortedMonthRows = monthRows
                .slice()
                .sort(
                  (left, right) =>
                    left.assessmentDate.getTime() - right.assessmentDate.getTime()
                );
              const presentRows = sortedMonthRows.filter(
                (row) => row.status === "PRESENT"
              );

              return {
                monthKey,
                monthLabel: toMonthLabel(sortedMonthRows[0].assessmentDate),
                totalTasks: sortedMonthRows.length,
                presentTaskCount: presentRows.length,
                averageScore: averageNullable(
                  presentRows.map((row) => row.averageScore)
                ),
                details: sortedMonthRows
              };
            });

          const presentYearRows = yearRows.filter((row) => row.status === "PRESENT");

          return {
            yearKey,
            yearLabel: toYearLabel(yearRows[0].assessmentDate),
            totalTasks: yearRows.length,
            presentTaskCount: presentYearRows.length,
            averageScore: averageNullable(
              presentYearRows.map((row) => row.averageScore)
            ),
            months
          };
        });

      const presentOfficerRows = officer.details.filter(
        (row) => row.status === "PRESENT"
      );

      return {
        officerId: officer.officerId,
        officerName: officer.officerName,
        officerNip: officer.officerNip,
        unitName: officer.unitName,
        totalTasks: officer.details.length,
        presentTaskCount: presentOfficerRows.length,
        averageScore: averageNullable(
          presentOfficerRows.map((row) => row.averageScore)
        ),
        years
      };
    });
}

export function buildCriteriaAverages(
  rows: ReportRow[],
  criteria: Array<{ id: string; name: string }>
) {
  return criteria.map((item) => {
    const values = rows
      .filter((row) => row.status === "PRESENT")
      .map(
        (row) =>
          row.criteriaScores.find((score) => score.criteriaId === item.id)?.score ??
          null
      )
      .filter((score): score is number => typeof score === "number");

    return {
      criteriaId: item.id,
      criteriaName: item.name,
      averageScore: values.length ? averageNullable(values) : null
    } satisfies ReportCriteriaAverage;
  });
}

export async function getReportData(params: ReportParams) {
  const timePreset = resolveTimePreset(params.timePreset);
  const presetRange = getTimePresetRange(timePreset);
  const hasExplicitRange = Boolean(params.from || params.to);
  const rankingPagination = resolvePaginationParams(
    params.rankingPage,
    params.rankingRowsPerPage,
    10
  );
  const previewPagination = resolvePaginationParams(
    params.previewPage,
    params.previewRowsPerPage,
    10
  );
  const filters = {
    search: params.search?.trim() || "",
    timePreset,
    from: hasExplicitRange ? params.from?.trim() || "" : presetRange.from,
    to: hasExplicitRange ? params.to?.trim() || "" : presetRange.to,
    unitId: params.unitId?.trim() || "",
    officerId: params.officerId?.trim() || ""
  };
  const shouldIncludeAllRows = Boolean(params.includeAllRows);
  const officerWhere =
    filters.search || filters.unitId || filters.officerId
      ? {
          ...(filters.unitId ? { unitId: filters.unitId } : {}),
          ...(filters.officerId ? { id: filters.officerId } : {}),
          ...(filters.search
            ? {
                OR: [
                  { name: { contains: filters.search, mode: "insensitive" as const } },
                  { nip: { contains: filters.search, mode: "insensitive" as const } }
                ]
              }
            : {})
        }
      : null;

  const where = {
    ...(officerWhere ? { officer: officerWhere } : {}),
    ...(filters.from || filters.to
      ? {
          assessmentDate: {
            ...(filters.from ? { gte: parseDateOnlyUtc(filters.from) } : {}),
            ...(filters.to ? { lte: parseDateOnlyUtc(filters.to) } : {})
          }
        }
      : {})
  };
  const presentWhere = {
    ...where,
    status: "PRESENT" as const
  };
  const absentWhere = {
    ...where,
    status: "ABSENT" as const
  };

  const [
    totalAssessments,
    totalPresent,
    totalAbsent,
    distinctOfficers,
    overallAverageResult,
    topOfficerGroup,
    rankingOfficerIds,
    previewAssessments,
    units,
    officers,
    criteria,
    filteredCriteriaScores
  ] = await Promise.all([
    prisma.dailyAssessment.count({ where }),
    prisma.dailyAssessment.count({ where: presentWhere }),
    prisma.dailyAssessment.count({ where: absentWhere }),
    prisma.dailyAssessment.findMany({
      where,
      distinct: ["officerId"],
      select: {
        officerId: true
      }
    }),
    prisma.dailyAssessment.aggregate({
      where: presentWhere,
      _avg: {
        averageScore: true
      }
    }),
    prisma.dailyAssessment.groupBy({
      by: ["officerId"],
      where: presentWhere,
      _avg: {
        averageScore: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _avg: {
          averageScore: "desc"
        }
      },
      take: 1
    }),
    prisma.dailyAssessment.groupBy({
      by: ["officerId"],
      where: presentWhere,
      _avg: {
        averageScore: true
      },
      _count: {
        _all: true
      },
      orderBy: [
        {
          _avg: {
            averageScore: "desc"
          }
        },
        {
          officerId: "asc"
        }
      ],
      ...(shouldIncludeAllRows
        ? {}
        : {
            skip:
              (rankingPagination.page - 1) * rankingPagination.rowsPerPage,
            take: rankingPagination.rowsPerPage
          })
    }),
    prisma.dailyAssessment.findMany({
      where,
      ...(shouldIncludeAllRows
        ? {}
        : {
            skip:
              (previewPagination.page - 1) * previewPagination.rowsPerPage,
            take: previewPagination.rowsPerPage
          }),
      include: {
        officer: {
          include: {
            unit: true
          }
        },
        scores: {
          include: {
            criteria: true
          },
          orderBy: {
            criteria: {
              sortOrder: "asc"
            }
          }
        }
      },
      orderBy: [{ assessmentDate: "desc" }, { officer: { name: "asc" } }]
    }),
    prisma.unit.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.officer.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        nip: true,
        unit: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.criteria.findMany({
      where: {
        isActive: true
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        sortOrder: true
      }
    }),
    prisma.assessmentScore.findMany({
      where: {
        dailyAssessment: presentWhere
      },
      select: {
        criteriaId: true,
        score: true
      }
    })
  ]);
  const rankingTotalItems = await prisma.dailyAssessment
    .findMany({
      where: presentWhere,
      distinct: ["officerId"],
      select: {
        officerId: true
      }
    })
    .then((items) => items.length);
  const rankingMeta = createPaginationMeta(
    rankingTotalItems,
    shouldIncludeAllRows ? 1 : rankingPagination.page,
    shouldIncludeAllRows ? Math.max(rankingTotalItems, 1) : rankingPagination.rowsPerPage
  );
  const previewMeta = createPaginationMeta(
    totalAssessments,
    shouldIncludeAllRows ? 1 : previewPagination.page,
    shouldIncludeAllRows ? Math.max(totalAssessments, 1) : previewPagination.rowsPerPage
  );
  const rankingOfficerMap = new Map(
    (
      await prisma.officer.findMany({
        where: {
          id: {
            in: rankingOfficerIds.map((item) => item.officerId)
          }
        },
        include: {
          unit: true
        }
      })
    ).map((officer) => [officer.id, officer])
  );
  const topOfficerId = topOfficerGroup[0]?.officerId;
  const topOfficerRecord = topOfficerId
    ? await prisma.officer.findUnique({
        where: { id: topOfficerId },
        include: {
          unit: true
        }
      })
    : null;
  const rows: ReportRow[] = previewAssessments.map((assessment) => {
    const scoreMap = Object.fromEntries(
      assessment.scores.map((score) => [score.criteriaId, score.score])
    );

    return {
      id: assessment.id,
      assessmentDate: assessment.assessmentDate,
      status: assessment.status,
      officerId: assessment.officerId,
      officerName: assessment.officer.name,
      officerNip: assessment.officer.nip,
      unitName: assessment.officer.unit?.name ?? "Belum ditentukan",
      averageScore: assessment.averageScore,
      criteriaScores: criteria.map((item) => ({
        criteriaId: item.id,
        criteriaName: item.name,
        score: scoreMap[item.id] ?? null
      })),
      relatedRecommendationLabels: []
    };
  });

  const ranking = rankingOfficerIds.map((item, index) => {
    const officer = rankingOfficerMap.get(item.officerId);

    return {
      officerId: item.officerId,
      officerName: officer?.name ?? "Petugas",
      officerNip: officer?.nip ?? "-",
      unitName: officer?.unit?.name ?? "Belum ditentukan",
      averageScore: Number(item._avg.averageScore?.toFixed(2) ?? 0),
      totalAssessments: item._count._all,
      rank:
        (rankingMeta.page - 1) * rankingMeta.rowsPerPage + index + 1
    };
  });
  const criteriaAverageMap = new Map<string, number[]>();

  filteredCriteriaScores.forEach((score) => {
    const current = criteriaAverageMap.get(score.criteriaId) ?? [];
    current.push(score.score);
    criteriaAverageMap.set(score.criteriaId, current);
  });

  return {
    filters,
    units,
    officers: officers.map((officer) => ({
      id: officer.id,
      name: officer.name,
      nip: officer.nip,
      unitName: officer.unit?.name ?? "Belum ditentukan"
    })),
    criteria,
    criteriaAverages: criteria.map((item) => ({
      criteriaId: item.id,
      criteriaName: item.name,
      averageScore: averageNullable(criteriaAverageMap.get(item.id) ?? [])
    })),
    rows,
    previewMeta,
    ranking,
    rankingMeta,
    summary: {
      totalAssessments,
      totalPresent,
      totalAbsent,
      totalOfficers: distinctOfficers.length,
      overallAverage: Number(
        (overallAverageResult._avg.averageScore ?? 0).toFixed(2)
      ),
      topOfficer:
        topOfficerRecord && topOfficerGroup[0]
          ? {
              officerName: topOfficerRecord.name,
              unitName: topOfficerRecord.unit?.name ?? "Belum ditentukan",
              averageScore: Number(
                (topOfficerGroup[0]._avg.averageScore ?? 0).toFixed(2)
              ),
              totalAssessments: topOfficerGroup[0]._count._all
            }
          : null
    }
  };
}
