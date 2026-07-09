import { prisma } from "@/lib/prisma";
import { parseDateOnlyUtc } from "@/lib/date-only";
import {
  createPaginationMeta,
  resolvePaginationParams
} from "@/lib/pagination";
import { getTimePresetRange, resolveTimePreset } from "@/lib/time-presets";

type ReportParams = {
  timePreset?: string;
  unitId?: string;
  rankingPage?: string;
  rankingRowsPerPage?: string;
  previewPage?: string;
  previewRowsPerPage?: string;
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
    criteria
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
      skip:
        (rankingPagination.page - 1) * rankingPagination.rowsPerPage,
      take: rankingPagination.rowsPerPage
    }),
    prisma.dailyAssessment.findMany({
      where,
      skip:
        (previewPagination.page - 1) * previewPagination.rowsPerPage,
      take: previewPagination.rowsPerPage,
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
    rankingPagination.page,
    rankingPagination.rowsPerPage
  );
  const previewMeta = createPaginationMeta(
    totalAssessments,
    previewPagination.page,
    previewPagination.rowsPerPage
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

  const rows = previewAssessments.map((assessment) => {
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

  return {
    filters,
    units,
    criteria,
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
