import { prisma } from "@/lib/prisma";
import { parseDateOnlyUtc } from "@/lib/date-only";
import {
  getTimePresetRange,
  resolveTimePreset
} from "@/lib/time-presets";

type DashboardParams = {
  timePreset?: string;
  unitId?: string;
  officerId?: string;
};

type PresentAssessmentPoint = {
  assessmentDate: Date;
  averageScore: number | null;
  officerId: string;
  officer: {
    unit: {
      id: string;
      name: string;
    } | null;
  };
};

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function buildTrendMap(
  assessments: PresentAssessmentPoint[],
  mode: "daily" | "weekly" | "monthly"
) {
  const map = new Map<string, number[]>();

  assessments.forEach((assessment) => {
    if (assessment.averageScore === null) {
      return;
    }

    const date = new Date(assessment.assessmentDate);
    const key =
      mode === "daily"
        ? formatDay(date)
        : mode === "weekly"
          ? formatDay(getWeekStart(date))
          : formatMonth(date);

    const current = map.get(key) ?? [];
    current.push(assessment.averageScore);
    map.set(key, current);
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, values]) => ({
      label,
      averageScore: average(values)
    }));
}

export async function getDashboardSummary(params: DashboardParams) {
  const timePreset = resolveTimePreset(params.timePreset);
  const range = getTimePresetRange(timePreset);
  const officerWhere =
    params.unitId || params.officerId
      ? {
          ...(params.unitId ? { unitId: params.unitId } : {}),
          ...(params.officerId ? { id: params.officerId } : {})
        }
      : null;
  const filters = {
    ...(officerWhere ? { officer: officerWhere } : {}),
    ...(range.from || range.to
      ? {
          assessmentDate: {
            ...(range.from ? { gte: parseDateOnlyUtc(range.from) } : {}),
            ...(range.to ? { lte: parseDateOnlyUtc(range.to) } : {})
          }
        }
      : {})
  };
  const presentFilters = {
    ...filters,
    status: "PRESENT" as const
  };
  const absentFilters = {
    ...filters,
    status: "ABSENT" as const
  };

  const [
    totalAssessments,
    totalPresent,
    totalAbsent,
    overallAverageResult,
    presentAssessments,
    rankingGroups,
    units,
    officers,
    criteriaScores
  ] = await Promise.all([
    prisma.dailyAssessment.count({
      where: filters
    }),
    prisma.dailyAssessment.count({
      where: presentFilters
    }),
    prisma.dailyAssessment.count({
      where: absentFilters
    }),
    prisma.dailyAssessment.aggregate({
      where: presentFilters,
      _avg: {
        averageScore: true
      }
    }),
    prisma.dailyAssessment.findMany({
      where: presentFilters,
      select: {
        officerId: true,
        assessmentDate: true,
        averageScore: true,
        officer: {
          select: {
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [{ assessmentDate: "asc" }]
    }),
    prisma.dailyAssessment.groupBy({
      by: ["officerId"],
      where: presentFilters,
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
      take: 10
    }),
    prisma.unit.findMany({
      orderBy: { name: "asc" },
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
    prisma.assessmentScore.findMany({
      where: {
        dailyAssessment: presentFilters
      },
      select: {
        criteriaId: true,
        score: true,
        criteria: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const rankingOfficerMap = new Map(
    (
      await prisma.officer.findMany({
        where: {
          id: {
            in: rankingGroups.map((item) => item.officerId)
          }
        },
        include: {
          unit: {
            select: {
              name: true
            }
          }
        }
      })
    ).map((officer) => [officer.id, officer])
  );

  const ranking = rankingGroups.map((item) => {
    const officer = rankingOfficerMap.get(item.officerId);

    return {
      officerId: item.officerId,
      officerName: officer?.name ?? "Petugas",
      unitName: officer?.unit?.name ?? "Belum ditentukan",
      averageScore: Number(item._avg.averageScore?.toFixed(2) ?? 0),
      totalAssessments: item._count._all
    };
  });

  const criteriaMap = new Map<string, { label: string; scores: number[] }>();

  criteriaScores.forEach((score) => {
    const existing = criteriaMap.get(score.criteriaId) ?? {
      label: score.criteria.name,
      scores: []
    };

    existing.scores.push(score.score);
    criteriaMap.set(score.criteriaId, existing);
  });

  const criteriaDistribution = [...criteriaMap.values()]
    .map((item) => ({
      label: item.label,
      averageScore: average(item.scores),
      totalScores: item.scores.length
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const unitMap = new Map<string, { label: string; scores: number[] }>();

  presentAssessments.forEach((assessment) => {
    const key = assessment.officer.unit?.id ?? "unassigned";
    const label = assessment.officer.unit?.name ?? "Belum ditentukan";
    const existing = unitMap.get(key) ?? { label, scores: [] };

    if (assessment.averageScore !== null) {
      existing.scores.push(assessment.averageScore);
    }

    unitMap.set(key, existing);
  });

  const unitComparison = [...unitMap.values()]
    .map((item) => ({
      label: item.label,
      averageScore: average(item.scores),
      totalAssessments: item.scores.length
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const dailyTrend = buildTrendMap(presentAssessments, "daily");
  const weeklyTrend = buildTrendMap(presentAssessments, "weekly");
  const monthlyTrend = buildTrendMap(presentAssessments, "monthly");

  const overallAverage = Number(
    (overallAverageResult._avg.averageScore ?? 0).toFixed(2)
  );

  const topOfficer = ranking[0] ?? null;

  return {
    filters: {
      timePreset,
      from: range.from,
      to: range.to,
      unitId: params.unitId ?? "",
      officerId: params.officerId ?? ""
    },
    units,
    officers: officers.map((officer) => ({
      id: officer.id,
      name: officer.name,
      nip: officer.nip,
      unitName: officer.unit?.name ?? "Belum ditentukan"
    })),
    summaryCards: {
      totalAssessments,
      totalPresent,
      totalAbsent,
      overallAverage,
      topOfficer
    },
    ranking,
    criteriaDistribution,
    unitComparison,
    trends: {
      daily: dailyTrend,
      weekly: weeklyTrend,
      monthly: monthlyTrend
    }
  };
}
