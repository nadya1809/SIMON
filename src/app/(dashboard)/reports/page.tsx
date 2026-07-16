import { ReportsOverview } from "@/components/reports/reports-overview";
import { requireAuth } from "@/lib/auth-guard";
import { getTodayDateInputValue } from "@/lib/date-only";
import { createPaginationMeta } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { getReportData } from "@/lib/reports";
import { buildRewardPunishmentWhere } from "@/lib/reward-punishment";

type ReportsPageProps = {
  searchParams?: Promise<{
    search?: string;
    timePreset?: string;
    unitId?: string;
    officerId?: string;
    rankingPage?: string;
    rankingRowsPerPage?: string;
    previewPage?: string;
    previewRowsPerPage?: string;
  }>;
};

const rewardPunishmentInclude = {
  officer: {
    include: {
      unit: true
    }
  },
  decidedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  }
} as const;

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const report = await getReportData({
    search: resolvedSearchParams?.search,
    timePreset: resolvedSearchParams?.timePreset,
    unitId: resolvedSearchParams?.unitId,
    officerId: resolvedSearchParams?.officerId,
    rankingPage: resolvedSearchParams?.rankingPage,
    rankingRowsPerPage: resolvedSearchParams?.rankingRowsPerPage,
    previewPage: resolvedSearchParams?.previewPage,
    previewRowsPerPage: resolvedSearchParams?.previewRowsPerPage
  });
  const rowsPerPage = 10;
  const rewardPunishmentFilters = {
    search: "",
    officerId: report.filters.officerId,
    unitId: report.filters.unitId,
    status: "",
    type: "",
    from: report.filters.from,
    to: report.filters.to
  };
  const rewardPunishmentWhere = buildRewardPunishmentWhere(rewardPunishmentFilters);
  const [
    totalRpItems,
    recommendations,
    units,
    officers,
    recommendedCount,
    approvedCount,
    rejectedCount
  ] = await Promise.all([
    prisma.rewardPunishment.count({ where: rewardPunishmentWhere }),
    prisma.rewardPunishment.findMany({
      where: rewardPunishmentWhere,
      skip: 0,
      take: rowsPerPage,
      include: rewardPunishmentInclude,
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }]
    }),
    prisma.unit.findMany({
      orderBy: {
        name: "asc"
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
    prisma.rewardPunishment.count({
      where: { ...rewardPunishmentWhere, status: "RECOMMENDED" }
    }),
    prisma.rewardPunishment.count({
      where: { ...rewardPunishmentWhere, status: "APPROVED" }
    }),
    prisma.rewardPunishment.count({
      where: { ...rewardPunishmentWhere, status: "REJECTED" }
    })
  ]);

  return (
    <ReportsOverview
      report={report}
      role={session.user.role}
      rewardPunishmentProps={{
        initialRecommendations: {
          data: recommendations,
          meta: createPaginationMeta(totalRpItems, 1, rowsPerPage),
          summary: {
            total: totalRpItems,
            RECOMMENDED: recommendedCount,
            APPROVED: approvedCount,
            REJECTED: rejectedCount
          }
        },
        units,
        officers: officers.map((officer) => ({
          id: officer.id,
          name: officer.name,
          nip: officer.nip,
          unitName: officer.unit?.name ?? "Belum ditentukan"
        })),
        defaultReferenceDate: getTodayDateInputValue(),
        role: session.user.role,
        embedded: true,
        showExportPanel: true,
        showListSection: false,
        showListControls: false,
        initialNavigationState: {
          officerFilter: report.filters.officerId || "all",
          unitFilter: report.filters.unitId || "all",
          timePreset: report.filters.timePreset,
          from: report.filters.from,
          to: report.filters.to
        }
      }}
    />
  );
}
