import { prisma } from "@/lib/prisma";
import { parseDateOnlyUtc } from "@/lib/date-only";
import { getTimePresetRange, resolveTimePreset } from "@/lib/time-presets";

type ReportParams = {
  timePreset?: string;
  unitId?: string;
};

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export async function getReportData(params: ReportParams) {
  const timePreset = resolveTimePreset(params.timePreset);
  const presetRange = getTimePresetRange(timePreset);
  const filters = {
    timePreset,
    from: presetRange.from,
    to: presetRange.to,
    unitId: params.unitId?.trim() || ""
  };

  const where = {
    ...(filters.unitId ? { officer: { unitId: filters.unitId } } : {}),
    ...(filters.from || filters.to
      ? {
          assessmentDate: {
            ...(filters.from ? { gte: parseDateOnlyUtc(filters.from) } : {}),
            ...(filters.to ? { lte: parseDateOnlyUtc(filters.to) } : {})
          }
        }
      : {})
  };

  const [assessments, units] = await Promise.all([
    prisma.dailyAssessment.findMany({
      where,
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
    })
  ]);

  const criteriaMap = new Map<
    string,
    { id: string; name: string; sortOrder: number }
  >();

  assessments.forEach((assessment) => {
    assessment.scores.forEach((score) => {
      criteriaMap.set(score.criteriaId, {
        id: score.criteriaId,
        name: score.criteria.name,
        sortOrder: score.criteria.sortOrder
      });
    });
  });

  const criteria = [...criteriaMap.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  );

  const rows = assessments.map((assessment) => {
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
      }))
    };
  });

  const officerMap = new Map<
    string,
    {
      officerId: string;
      officerName: string;
      officerNip: string;
      unitName: string;
      scores: number[];
    }
  >();

  rows.forEach((row) => {
    if (row.averageScore === null) {
      return;
    }

    const existing = officerMap.get(row.officerId) ?? {
      officerId: row.officerId,
      officerName: row.officerName,
      officerNip: row.officerNip,
      unitName: row.unitName,
      scores: []
    };

    existing.scores.push(row.averageScore);
    officerMap.set(row.officerId, existing);
  });

  const ranking = [...officerMap.values()]
    .map((item) => ({
      officerId: item.officerId,
      officerName: item.officerName,
      officerNip: item.officerNip,
      unitName: item.unitName,
      averageScore: average(item.scores),
      totalAssessments: item.scores.length
    }))
    .sort((a, b) => b.averageScore - a.averageScore || a.officerName.localeCompare(b.officerName))
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  const presentRows = rows.filter((row) => row.status === "PRESENT");
  const absentRows = rows.filter((row) => row.status === "ABSENT");

  return {
    filters,
    units,
    criteria,
    rows,
    ranking,
    summary: {
      totalAssessments: rows.length,
      totalPresent: presentRows.length,
      totalAbsent: absentRows.length,
      totalOfficers: new Set(rows.map((row) => row.officerId)).size,
      overallAverage: average(
        presentRows
          .map((row) => row.averageScore)
          .filter((score): score is number => score !== null)
      )
    }
  };
}
