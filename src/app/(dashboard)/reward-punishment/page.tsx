import { RewardPunishmentManagement } from "@/components/reward-punishment/reward-punishment-management";
import { requireAuth } from "@/lib/auth-guard";
import { getTodayDateInputValue } from "@/lib/date-only";
import { createPaginationMeta } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { buildRewardPunishmentWhere } from "@/lib/reward-punishment";

type RewardPunishmentPageProps = {
  searchParams?: Promise<{
    notification?: string;
    focus?: string;
    open?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function RewardPunishmentPage({
  searchParams
}: RewardPunishmentPageProps) {
  const session = await requireAuth();
  const resolvedSearchParams = await searchParams;
  const rewardPunishmentWhere = buildRewardPunishmentWhere({
    search: "",
    officerId: "",
    unitId: "",
    status: resolvedSearchParams?.status ?? "",
    type: resolvedSearchParams?.type ?? "",
    from: resolvedSearchParams?.from ?? "",
    to: resolvedSearchParams?.to ?? ""
  });
  const rowsPerPage = 10;
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

  const [
    totalItems,
    recommendations,
    units,
    officers,
    recommendedCount,
    approvedCount,
    rejectedCount,
    focusedRecommendation
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
    }),
    resolvedSearchParams?.focus
      ? prisma.rewardPunishment.findUnique({
          where: {
            id: resolvedSearchParams.focus
          },
          include: rewardPunishmentInclude
        })
      : Promise.resolve(null)
  ]);

  return (
    <RewardPunishmentManagement
      initialRecommendations={{
        data: recommendations,
        meta: createPaginationMeta(totalItems, 1, rowsPerPage),
        summary: {
          total: totalItems,
          RECOMMENDED: recommendedCount,
          APPROVED: approvedCount,
          REJECTED: rejectedCount
        }
      }}
      units={units}
      officers={officers.map((officer) => ({
        id: officer.id,
        name: officer.name,
        nip: officer.nip,
        unitName: officer.unit?.name ?? "Belum ditentukan"
      }))}
      defaultReferenceDate={getTodayDateInputValue()}
      role={session.user.role}
      initialInfoMessage={resolvedSearchParams?.notification}
      initialFocusedRecommendation={focusedRecommendation}
      initialNavigationState={{
        focusRecommendationId: resolvedSearchParams?.focus,
        openDetail: resolvedSearchParams?.open === "detail",
        statusFilter:
          resolvedSearchParams?.status === "RECOMMENDED" ||
          resolvedSearchParams?.status === "APPROVED" ||
          resolvedSearchParams?.status === "REJECTED"
            ? resolvedSearchParams.status
            : "all",
        typeFilter:
          resolvedSearchParams?.type === "EVALUASI" ||
          resolvedSearchParams?.type === "REWARD" ||
          resolvedSearchParams?.type === "PUNISHMENT"
            ? resolvedSearchParams.type
            : "all",
        from: resolvedSearchParams?.from ?? "",
        to: resolvedSearchParams?.to ?? ""
      }}
    />
  );
}
