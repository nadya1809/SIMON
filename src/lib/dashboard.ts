import { prisma } from "@/lib/prisma";

type DashboardParams = {
  from?: string;
  to?: string;
  unitId?: string;
};

type AssessmentWithRelations = Awaited<
  ReturnType<typeof prisma.dailyAssessment.findMany>
>[number];

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

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
  assessments: AssessmentWithRelations[],
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
  const filters = {
    ...(params.unitId ? { officer: { unitId: params.unitId } } : {}),
    ...(params.from || params.to
      ? {
          assessmentDate: {
            ...(params.from ? { gte: toDateOnly(params.from) } : {}),
            ...(params.to ? { lte: toDateOnly(params.to) } : {})
          }
        }
      : {})
  };

  const [allAssessments, presentAssessments, units] = await Promise.all([
    prisma.dailyAssessment.findMany({
      where: filters,
      include: {
        officer: {
          include: {
            unit: true
          }
        },
        scores: {
          include: {
            criteria: true
          }
        }
      },
      orderBy: [{ assessmentDate: "asc" }]
    }),
    prisma.dailyAssessment.findMany({
      where: {
        ...filters,
        status: "PRESENT"
      },
      include: {
        officer: {
          include: {
            unit: true
          }
        },
        scores: {
          include: {
            criteria: true
          }
        }
      },
      orderBy: [{ assessmentDate: "asc" }]
    }),
    prisma.unit.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    })
  ]);

  const officerMap = new Map<
    string,
    {
      officerId: string;
      officerName: string;
      unitName: string;
      scores: number[];
    }
  >();

  presentAssessments.forEach((assessment) => {
    const existing = officerMap.get(assessment.officerId) ?? {
      officerId: assessment.officerId,
      officerName: assessment.officer.name,
      unitName: assessment.officer.unit?.name ?? "Belum ditentukan",
      scores: []
    };

    if (assessment.averageScore !== null) {
      existing.scores.push(assessment.averageScore);
    }

    officerMap.set(assessment.officerId, existing);
  });

  const ranking = [...officerMap.values()]
    .map((item) => ({
      officerId: item.officerId,
      officerName: item.officerName,
      unitName: item.unitName,
      averageScore: average(item.scores),
      totalAssessments: item.scores.length
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10);

  const criteriaMap = new Map<string, { label: string; scores: number[] }>();

  presentAssessments.forEach((assessment) => {
    assessment.scores.forEach((score) => {
      const existing = criteriaMap.get(score.criteriaId) ?? {
        label: score.criteria.name,
        scores: []
      };

      existing.scores.push(score.score);
      criteriaMap.set(score.criteriaId, existing);
    });
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

  const totalAssessments = allAssessments.length;
  const totalPresent = presentAssessments.length;
  const totalAbsent = allAssessments.filter(
    (assessment) => assessment.status === "ABSENT"
  ).length;
  const overallAverage = average(
    presentAssessments
      .map((assessment) => assessment.averageScore)
      .filter((score): score is number => score !== null)
  );

  const topOfficer = ranking[0] ?? null;

  return {
    filters: {
      from: params.from ?? "",
      to: params.to ?? "",
      unitId: params.unitId ?? ""
    },
    units,
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
